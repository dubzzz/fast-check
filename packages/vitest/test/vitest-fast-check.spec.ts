import * as path from 'path';
import * as url from 'url';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execFile = promisify(_execFile);
// @ts-expect-error --module must be higher
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import type _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/vitest';
declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;

const generatedTestsDirectoryName = '.test-artifacts';
const generatedTestsDirectory = path.join(__dirname, '..', generatedTestsDirectoryName);
const specFileName = `generated.spec.mjs`;
const vitestConfigName = `vitest.config.mjs`;

type RunnerType = 'test' | 'it';

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
    const specDirectory = await writeToFile(runnerName, () => {
      runner.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectPass(out);
  });

  describe('at depth 1', () => {
    it.concurrent(`should support ${runnerName}.concurrent.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.concurrent.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent(`should support ${runnerName}.fails.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.fails.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
    });

    it.skip(`should support ${runnerName}.only.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.only.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent(`should support ${runnerName}.skip.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.skip.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectSkip(out);
    });

    it.concurrent(`should support ${runnerName}.todo.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.todo.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectSkip(out);
    });
  });

  describe('at depth strictly above 1', () => {
    it.concurrent(`should support ${runnerName}.concurrent.fails.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.concurrent.fails.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
    });

    it.concurrent(`should support ${runnerName}.concurrent.fails.only.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.concurrent.fails.only.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
    });

    it.concurrent(`should support ${runnerName}.concurrent.fails.skip.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.concurrent.fails.skip.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectSkip(out);
    });

    it.concurrent(`should support ${runnerName}.concurrent.fails.todo.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.concurrent.fails.todo.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectSkip(out);
    });
  });
});

// Helper

let num = -1;
async function writeToFile(runner: 'test' | 'it', fileContent: () => void): Promise<string> {
  // Prepare directory for spec
  const specDirectorySeed = `${Math.random().toString(16).substring(2)}-${++num}`;
  const specDirectory = path.join(generatedTestsDirectory, `test-${specDirectorySeed}`);
  await fs.mkdir(specDirectory, { recursive: true });

  // Prepare test file itself
  const specFilePath = path.join(specDirectory, specFileName);
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
  const vitestConfigPath = path.join(specDirectory, vitestConfigName);

  // Write the files
  await Promise.all([
    fs.writeFile(specFilePath, specContent),
    fs.writeFile(
      vitestConfigPath,
      `import { defineConfig } from 'vite';\n` +
        `export default defineConfig({ test: { include: ['${specFileName}'], }, });`,
    ),
  ]);

  return specDirectory;
}

async function runSpec(specDirectory: string): Promise<string> {
  const { stdout: vitestBinaryPathCommand } = await execFile('pnpm', ['bin'], { shell: true });
  const vitestBinaryPath = path.join(vitestBinaryPathCommand.split('\n')[0], 'vitest');
  try {
    const { stdout: specOutput } = await execFile(
      'node',
      [
        vitestBinaryPath,
        '--config',
        vitestConfigName,
        '--run', // no watch
        '--no-color',
      ],
      { cwd: specDirectory },
    );
    return specOutput;
  } catch (err) {
    return (err as any).stderr;
  }
}

function expectPass(out: string): void {
  expect(out).toContain('✓ ' + specFileName);
}

function expectFail(out: string): void {
  expect(out).toContain('FAIL  ' + specFileName);
}

function expectSkip(out: string): void {
  expect(out).toContain('↓ ' + specFileName);
}
