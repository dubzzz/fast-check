import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
const execFile = promisify(_execFile);

import _fc from 'fast-check';
import { test as _test, it as _it } from '@fast-check/vitest';
declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;

const generatedTestsDirectoryName = 'generated-tests';
const generatedTestsDirectory = path.join(__dirname, generatedTestsDirectoryName);

type RunnerType = 'test' | 'it';

jest.setTimeout(60_000);

beforeAll(async () => {
  await fs.mkdir(generatedTestsDirectory, { recursive: true });
});
afterAll(async () => {
  await fs.rm(generatedTestsDirectory, { recursive: true });
});

type DescribeOptions = {
  specName: string;
  runnerName: RunnerType;
};

describe.each<DescribeOptions>([
  { specName: 'test', runnerName: 'test' },
  { specName: 'it', runnerName: 'it' },
])('$specName', ({ runnerName }) => {
  it.concurrent(`should support ${runnerName}.prop`, async () => {
    // Arrange
    const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
      runner.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectPass(out, specFileName);
  });

  describe('at depth 1', () => {
    it.concurrent(`should support ${runnerName}.concurrent.prop`, async () => {
      // Arrange
      const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.concurrent.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectPass(out, specFileName);
    });

    it.concurrent(`should support ${runnerName}.fails.prop`, async () => {
      // Arrange
      const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.fails.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
    });

    it.concurrent.skip(`should support ${runnerName}.only.prop`, async () => {
      // Arrange
      const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.only.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectPass(out, specFileName);
    });

    it.concurrent(`should support ${runnerName}.skip.prop`, async () => {
      // Arrange
      const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.skip.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectSkip(out, specFileName);
    });

    it.concurrent(`should support ${runnerName}.todo.prop`, async () => {
      // Arrange
      const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.todo.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectSkip(out, specFileName);
    });
  });

  describe('at depth strictly above 1', () => {
    it.concurrent(`should support ${runnerName}.concurrent.fails.prop`, async () => {
      // Arrange
      const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.concurrent.fails.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
    });

    it.concurrent(`should support ${runnerName}.concurrent.fails.only.prop`, async () => {
      // Arrange
      const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.concurrent.fails.only.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
    });

    it.concurrent(`should support ${runnerName}.concurrent.fails.skip.prop`, async () => {
      // Arrange
      const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.concurrent.fails.skip.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectSkip(out, specFileName);
    });

    it.concurrent(`should support ${runnerName}.concurrent.fails.todo.prop`, async () => {
      // Arrange
      const { specFileName, vitestConfigRelativePath: jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.concurrent.fails.todo.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectSkip(out, specFileName);
    });
  });
});

// Helper

let num = -1;
async function writeToFile(
  runner: 'test' | 'it',
  fileContent: () => void,
): Promise<{ specFileName: string; vitestConfigRelativePath: string }> {
  const specFileSeed = Math.random().toString(16).substring(2);

  // Prepare test file itself
  const specFileName = `generated-${specFileSeed}-${++num}.spec.mjs`;
  const specFilePath = path.join(generatedTestsDirectory, specFileName);
  const fileContentString = String(fileContent);
  const wrapInDescribeIfNeeded =
    runner === 'it'
      ? (testCode: string) => `describe('test suite', () => {\n${testCode}\n});`
      : (testCode: string) => testCode;
  const importFromFastCheckVitest = `import {${runner} as runner} from '@fast-check/vitest';\n`;
  const specContent =
    "import {describe} from 'vitest';\n" +
    "import * as fc from 'fast-check';\n" +
    importFromFastCheckVitest +
    wrapInDescribeIfNeeded(
      fileContentString.substring(fileContentString.indexOf('{') + 1, fileContentString.lastIndexOf('}')),
    );

  // Prepare jest config itself
  const vitestConfigName = `vitest.config-${specFileSeed}.mjs`;
  const vitestConfigRelativePath = `test/${generatedTestsDirectoryName}/${vitestConfigName}`;
  const vitestConfigPath = path.join(generatedTestsDirectory, vitestConfigName);

  // Write the files
  await Promise.all([
    fs.writeFile(specFilePath, specContent),
    fs.writeFile(
      vitestConfigPath,
      `import { defineConfig } from 'vite';\n` +
        `export default defineConfig({ test: { include: ['test/${generatedTestsDirectoryName}/${specFileName}'], }, });`,
    ),
  ]);

  return { specFileName, vitestConfigRelativePath: vitestConfigRelativePath };
}

async function runSpec(vitestConfigRelativePath: string): Promise<string> {
  const { stdout: vitestBinaryPathCommand } = await execFile('yarn', ['bin', 'vitest'], { shell: true });
  const vitestBinaryPath = vitestBinaryPathCommand.split('\n')[0];
  try {
    const { stdout: specOutput } = await execFile('node', [
      vitestBinaryPath,
      '--config',
      vitestConfigRelativePath,
      '--run', // no watch
      '--no-color',
    ]);
    return specOutput;
  } catch (err) {
    return (err as any).stderr;
  }
}

function expectPass(out: string, specFileName: string): void {
  expect(out).toMatch(new RegExp('✓ .*\\/' + specFileName));
}

function expectFail(out: string, specFileName: string): void {
  expect(out).toMatch(new RegExp('FAIL .*\\/' + specFileName));
}

function expectSkip(out: string, specFileName: string): void {
  expect(out).toMatch(new RegExp('↓ .*\\/' + specFileName));
}
