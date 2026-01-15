import { describe, it, expect, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { removeNonPublishedFiles } from '../src/packaged';

const testDirname = path.join(
  // @ts-expect-error --module must be higher
  import.meta.dirname,
  '..',
  '.test-artifacts',
);

afterAll(async () => {
  await fs.rmdir(testDirname);
});

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
        expect(removed).toHaveLength(3); // src, test, node_modules
      } else {
        expect(kept).toHaveLength(4); // package.json, lib/main.js, lib, node_modules/*
        expect(removed).toHaveLength(2); //  src, test
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
      expect(kept).toHaveLength(5); // package.json, lib/main.js, lib, src2/main.js, src2
      expect(removed).toHaveLength(2); // .npmignore, src
      expect(await fileSystem.exists(['package.json'])).toBe(true);
      expect(await fileSystem.exists(['lib', 'main.js'])).toBe(true);
      expect(await fileSystem.exists(['src2', 'main.js'])).toBe(true);
      expect(await fileSystem.exists(['src'])).toBe(false);
      expect(await fileSystem.exists(['.npmignore'])).toBe(false);
    });
  });

  it('should handle TypeScript-like packages having source, build and test files next to each others', async () => {
    await runPackageTest(async (fileSystem) => {
      // Arrange
      const packageJsonContent = {
        name: 'my-package',
        version: '0.0.0',
        files: ['**/*.js', '**/*.d.ts', '!**/*.spec.js', '!**/*.spec.d.ts'],
        license: 'MIT',
      };
      await fileSystem.createFile(['package.json'], JSON.stringify(packageJsonContent));
      await fileSystem.createFile(['tsconfig.json'], '// empty tsconfig.json');
      await fileSystem.createFile(['main.ts'], '// empty main.ts');
      await fileSystem.createFile(['main.d.ts'], '// empty main.d.ts');
      await fileSystem.createFile(['main.js'], '// empty main.js');
      await fileSystem.createFile(['main.spec.ts'], '// empty main.spec.ts');
      await fileSystem.createFile(['main.spec.d.ts'], '// empty main.spec.d.ts');
      await fileSystem.createFile(['main.spec.js'], '// empty main.spec.js');
      await fileSystem.createFile(['internals', 'index.ts'], '// empty internals/index.ts');
      await fileSystem.createFile(['internals', 'index.d.ts'], '// empty internals/index.d.ts');
      await fileSystem.createFile(['internals', 'index.js'], '// empty internals/index.js');
      await fileSystem.createFile(['internals', 'index.spec.ts'], '// empty internals/index.spec.ts');
      await fileSystem.createFile(['internals', 'index.spec.d.ts'], '// empty internals/index.spec.d.ts');
      await fileSystem.createFile(['internals', 'index.spec.js'], '// empty internals/index.spec.js');
      await fileSystem.createFile(['internals', 'a', 'item.ts'], '// empty internals/a/item.ts');
      await fileSystem.createFile(['internals', 'a', 'item.d.ts'], '// empty internals/a/item.d.ts');
      await fileSystem.createFile(['internals', 'a', 'item.js'], '// empty internals/a/item.js');
      await fileSystem.createFile(['internals', 'a', 'item.spec.ts'], '// empty internals/a/item.spec.ts');
      await fileSystem.createFile(['internals', 'a', 'item.spec.d.ts'], '// empty internals/a/item.spec.d.ts');
      await fileSystem.createFile(['internals', 'a', 'item.spec.js'], '// empty internals/a/item.spec.js');
      await fileSystem.createFile(['internals', 'b', 'item.ts'], '// empty internals/b/item.ts');
      await fileSystem.createFile(['internals', 'b', 'item.d.ts'], '// empty internals/b/item.d.ts');
      await fileSystem.createFile(['internals', 'b', 'item.js'], '// empty internals/b/item.js');
      await fileSystem.createFile(['internals', 'b', 'item.spec.ts'], '// empty internals/b/item.spec.ts');
      await fileSystem.createFile(['internals', 'b', 'item.spec.d.ts'], '// empty internals/b/item.spec.d.ts');
      await fileSystem.createFile(['internals', 'b', 'item.spec.js'], '// empty internals/b/item.spec.js');
      await fileSystem.createFile(['test', 'index.spec.ts'], '// empty test/index.spec.ts');
      await fileSystem.createFile(['test', 'index.spec.d.ts'], '// empty test/index.spec.d.ts');
      await fileSystem.createFile(['test', 'index.spec.js'], '// empty test/index.spec.js');

      // Act
      const { kept, removed } = await removeNonPublishedFiles(fileSystem.packagePath);

      // Assert
      expect(kept).toHaveLength(12);
      // package.json, main.d.ts, main.js,
      // internals, internals/index.d.ts, internals/index.js,
      // internals/a, internals/a/item.d.ts, internals/a/item.js,
      // internals/b, internals/b/item.d.ts, internals/b/item.js
      expect(removed).toHaveLength(18);
      // tsconfig.json, main.ts, main.spec.ts, main.spec.d.ts, main.spec.js,
      // internals/index.ts, internals/index.spec.ts, internals/index.spec.d.ts, internals/index.spec.js,
      // internals/a/item.ts, internals/a/item.spec.ts, internals/a/item.spec.d.ts, internals/a/item.spec.js,
      // internals/b/item.ts, internals/b/item.spec.ts, internals/b/item.spec.d.ts, internals/b/item.spec.js,
      // test
      expect(await fileSystem.exists(['package.json'])).toBe(true);
      expect(await fileSystem.exists(['tsconfig.json'])).toBe(false);
      expect(await fileSystem.exists(['main.ts'])).toBe(false);
      expect(await fileSystem.exists(['main.d.ts'])).toBe(true);
      expect(await fileSystem.exists(['main.js'])).toBe(true);
      expect(await fileSystem.exists(['main.spec.ts'])).toBe(false);
      expect(await fileSystem.exists(['main.spec.d.ts'])).toBe(false);
      expect(await fileSystem.exists(['main.spec.js'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'index.ts'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'index.d.ts'])).toBe(true);
      expect(await fileSystem.exists(['internals', 'index.js'])).toBe(true);
      expect(await fileSystem.exists(['internals', 'index.spec.ts'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'index.spec.d.ts'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'index.spec.js'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'a', 'item.ts'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'a', 'item.d.ts'])).toBe(true);
      expect(await fileSystem.exists(['internals', 'a', 'item.js'])).toBe(true);
      expect(await fileSystem.exists(['internals', 'a', 'item.spec.ts'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'a', 'item.spec.d.ts'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'a', 'item.spec.js'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'b', 'item.ts'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'b', 'item.d.ts'])).toBe(true);
      expect(await fileSystem.exists(['internals', 'b', 'item.js'])).toBe(true);
      expect(await fileSystem.exists(['internals', 'b', 'item.spec.ts'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'b', 'item.spec.d.ts'])).toBe(false);
      expect(await fileSystem.exists(['internals', 'b', 'item.spec.js'])).toBe(false);
      expect(await fileSystem.exists(['test', 'index.spec.ts'])).toBe(false);
      expect(await fileSystem.exists(['test', 'index.spec.d.ts'])).toBe(false);
      expect(await fileSystem.exists(['test', 'index.spec.js'])).toBe(false);
    });
  });

  it('should preserve deeply nested file when published', async () => {
    await runPackageTest(async (fileSystem) => {
      // Arrange
      const packageJsonContent = {
        name: 'my-package',
        version: '0.0.0',
        files: ['lib'],
        license: 'MIT',
      };
      await fileSystem.createFile(['package.json'], JSON.stringify(packageJsonContent));
      await fileSystem.createFile(['lib', 'a', 'b', 'c', 'd', 'main.js'], '// empty main.js');

      // Act
      const { kept, removed } = await removeNonPublishedFiles(fileSystem.packagePath);

      // Assert
      expect(kept).toHaveLength(7); // package.json, lib, lib/a, lib/a/b, lib/a/b/c, lib/a/b/c/d, lib/a/b/c/d/main.js
      expect(removed).toHaveLength(0);
      expect(await fileSystem.exists(['package.json'])).toBe(true);
      expect(await fileSystem.exists(['lib', 'a', 'b', 'c', 'd', 'main.js'])).toBe(true);
    });
  });

  it('should drop deeply nested file when unpublished', async () => {
    await runPackageTest(async (fileSystem) => {
      // Arrange
      const packageJsonContent = {
        name: 'my-package',
        version: '0.0.0',
        files: ['lib'],
        license: 'MIT',
      };
      await fileSystem.createFile(['package.json'], JSON.stringify(packageJsonContent));
      await fileSystem.createFile(['src', 'a', 'b', 'c', 'd', 'main.js'], '// empty main.js');

      // Act
      const { kept, removed } = await removeNonPublishedFiles(fileSystem.packagePath);

      // Assert
      expect(kept).toHaveLength(1); // package.json
      expect(removed).toHaveLength(1); // src
      expect(await fileSystem.exists(['package.json'])).toBe(true);
      expect(await fileSystem.exists(['src', 'a', 'b', 'c', 'd', 'main.js'])).toBe(false);
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
  const packagePath = path.join(testDirname, packageName);
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
          () => false,
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
