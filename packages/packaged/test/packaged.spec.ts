import { promises as fs } from 'fs';
import * as path from 'path';
import { removeNonPublishedFiles } from '../src/packaged';

describe('removeNonPublishedFiles', () => {
  it.each`
    name                                                                   | dryRun   | keepNodeModules | pathStyle
    ${'only keep published files by default'}                              | ${false} | ${false}        | ${'absolute'}
    ${'only keep published files and node_modules at root when requested'} | ${false} | ${true}         | ${'absolute'}
    ${'not clean anything in dryRun mode even without keepNodeModules'}    | ${true}  | ${false}        | ${'absolute'}
    ${'not clean anything in dryRun mode even with keepNodeModules'}       | ${true}  | ${true}         | ${'absolute'}
    ${'handle relative paths such as .'}                                   | ${false} | ${false}        | ${'.'}
    ${'handle relative paths such as ./package-name'}                      | ${false} | ${false}        | ${'./package-name'}
    ${'handle relative paths such as ./a/package-name'}                    | ${false} | ${false}        | ${'./a/package-name'}
    ${'handle relative paths such as ./a/../a/package-name/'}              | ${false} | ${false}        | ${'./a/../a/package-name/'}
  `('should $name', async ({ dryRun, keepNodeModules, pathStyle }) => {
    await runPackageTest(async (fileSystem) => {
      // Arrange
      const packageJsonContent = {
        name: 'my-package',
        version: '0.0.0',
        files: ['lib'],
        license: 'MIT',
      };
      await fileSystem.createFile(['package.json'], JSON.stringify(packageJsonContent));
      await fileSystem.createFile(['lib', 'main.js'], 'console.log("main.js")');
      await fileSystem.createFile(['src', 'main.js'], 'console.log("main.js")');
      await fileSystem.createFile(['src', 'node_modules', 'wtf', 'main.js'], 'console.log("main.js")');
      await fileSystem.createFile(['test', 'main.js'], 'console.log("main.js")');
      await fileSystem.createFile(['node_modules', 'dep-a', 'main.js'], 'console.log("main.js")');

      // Act
      let requestedPath = '';
      const lastFolderName = path.basename(fileSystem.packagePath);
      const beforeLastFolderName = path.basename(path.dirname(fileSystem.packagePath));
      switch (pathStyle) {
        case 'absolute':
          requestedPath = fileSystem.packagePath;
          break;
        case '.':
          process.chdir(fileSystem.packagePath);
          requestedPath = pathStyle;
          break;
        case './package-name':
          process.chdir(path.join(fileSystem.packagePath, '..'));
          requestedPath = `./${lastFolderName}`;
          break;
        case './a/package-name':
          process.chdir(path.join(fileSystem.packagePath, '..', '..'));
          requestedPath = `./${beforeLastFolderName}/${lastFolderName}`;
          break;
        case './a/../a/package-name/':
          process.chdir(path.join(fileSystem.packagePath, '..', '..'));
          requestedPath = `./${beforeLastFolderName}/../${beforeLastFolderName}/${lastFolderName}`;
          break;
        default:
          throw new Error(`Unsupported style ${pathStyle}`);
      }
      const { kept, removed } = await removeNonPublishedFiles(requestedPath, { dryRun, keepNodeModules });

      // Assert
      // Returns arrays having the expected sizes
      if (!keepNodeModules) {
        expect(kept).toHaveLength(3); // package.json, lib/main.js, lib
        expect(removed).toHaveLength(10); // src/main.js, src, test/main.js, test, node_modules/dep-a/main.js, node_modules/dep-a, node_modules, src/node_modules/wtf/main.js, src/node_modules/wtf, src/node_modules
      } else {
        expect(kept).toHaveLength(4); // package.json, lib/main.js, lib, node_modules/*
        expect(removed).toHaveLength(7); // src/main.js, src, test/main.js, test, src/node_modules/wtf/main.js, src/node_modules/wtf, src/node_modules
      }
      // Remove unpublished files and keep published ones
      expect(await fileSystem.exists(['package.json'])).toBe(true);
      expect(await fileSystem.exists(['lib', 'main.js'])).toBe(true);
      expect(await fileSystem.exists(['src', 'main.js'])).toBe(dryRun);
      expect(await fileSystem.exists(['src', 'node_modules', 'wtf', 'main.js'])).toBe(dryRun);
      expect(await fileSystem.exists(['test', 'main.js'])).toBe(dryRun);
      expect(await fileSystem.exists(['node_modules', 'dep-a', 'main.js'])).toBe(dryRun || keepNodeModules);
      // Remove empty folders
      expect(await fileSystem.exists(['src'])).toBe(dryRun);
      expect(await fileSystem.exists(['src', 'node_modules'])).toBe(dryRun);
      expect(await fileSystem.exists(['src', 'node_modules', 'wtf'])).toBe(dryRun);
      expect(await fileSystem.exists(['test'])).toBe(dryRun);
      expect(await fileSystem.exists(['node_modules'])).toBe(dryRun || keepNodeModules);
      expect(await fileSystem.exists(['node_modules', 'dep-a'])).toBe(dryRun || keepNodeModules);
    });
  });

  it('should handle packages relying on .npmignore', async () => {
    await runPackageTest(async (fileSystem) => {
      // Arrange
      const packageJsonContent = {
        name: 'my-package',
        version: '0.0.0',
        license: 'MIT',
      };
      await fileSystem.createFile(['package.json'], JSON.stringify(packageJsonContent));
      await fileSystem.createFile(['lib', 'main.js'], 'console.log("main.js")');
      await fileSystem.createFile(['src', 'main.js'], 'console.log("main.js")');
      await fileSystem.createFile(['src2', 'main.js'], 'console.log("main.js")');
      await fileSystem.createFile(['.npmignore'], 'src');

      // Act
      const { kept, removed } = await removeNonPublishedFiles(fileSystem.packagePath);

      // Assert
      expect(kept).toHaveLength(5); // package.sjon, lib/main.js, lib, src2/main.js, src2
      expect(removed).toHaveLength(3); // .npmignore, src/main.js, src
      expect(await fileSystem.exists(['package.json'])).toBe(true);
      expect(await fileSystem.exists(['lib', 'main.js'])).toBe(true);
      expect(await fileSystem.exists(['src2', 'main.js'])).toBe(true);
      expect(await fileSystem.exists(['src'])).toBe(false);
      expect(await fileSystem.exists(['.npmignore'])).toBe(false);
    });
  });
});

// Helpers

type FilePathChunks = [string, ...string[]];

type RunnerFileSystem = {
  packagePath: string;
  createFile: (filePathChunks: FilePathChunks, fileContent: string) => Promise<void>;
  exists: (filePathChunks: FilePathChunks) => Promise<boolean>;
};

async function runPackageTest(runner: (fileSystem: RunnerFileSystem) => Promise<void>): Promise<void> {
  const initialWorkingDirectory = process.cwd();
  const packageName = `random-package-${Date.now().toString(16)}-${Math.random().toString(16).substring(2)}`;
  const packagePath = path.join(__dirname, packageName);
  try {
    const fileSystem: RunnerFileSystem = {
      packagePath,
      async createFile(filePathChunks, fileContent) {
        const directoryPath = path.join(packagePath, ...filePathChunks.slice(0, -1));
        await fs.mkdir(directoryPath, { recursive: true });
        const filePath = path.join(packagePath, ...filePathChunks);
        await fs.writeFile(filePath, fileContent);
      },
      async exists(filePathChunks) {
        const filePath = path.join(packagePath, ...filePathChunks);
        return fs.access(filePath).then(
          () => true,
          () => false
        );
      },
    };
    await runner(fileSystem);
  } finally {
    process.chdir(initialWorkingDirectory);
    await fs.rm(packagePath, { recursive: true });
  }
  return;
}
