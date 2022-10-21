import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
const execFile = promisify(_execFile);

import _fc from 'fast-check';
import { test as _test, it as _it } from '@fast-check/jest';
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

describe.each<{ runnerName: RunnerType }>([{ runnerName: 'test' }, { runnerName: 'it' }])(
  '$runner',
  ({ runnerName }) => {
    it.concurrent('should pass on truthy synchronous property', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.prop([fc.string(), fc.string(), fc.string()])('property pass sync', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectPass(out, specFileName);
      expect(out).toMatch(/[√✓] property pass sync \(with seed=-?\d+\)/);
    });

    it.concurrent('should pass on truthy asynchronous property', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.prop([fc.string(), fc.string(), fc.string()])('property pass async', async (a, b, c) => {
          await new Promise((resolve) => setTimeout(resolve, 0));
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectPass(out, specFileName);
      expect(out).toMatch(/[√✓] property pass async \(with seed=-?\d+\)/);
    });

    it.concurrent('should fail on falsy synchronous property', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.prop([fc.nat()])('property fail sync', (a) => {
          return a === 0;
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectAlignedSeeds(out);
      expect(out).toMatch(/[×✕] property fail sync \(with seed=-?\d+\)/);
    });

    it.concurrent('should fail on falsy asynchronous property', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.prop([fc.nat()])('property fail async', async (a) => {
          await new Promise((resolve) => setTimeout(resolve, 0));
          return a === 0;
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectAlignedSeeds(out);
      expect(out).toMatch(/[×✕] property fail async \(with seed=-?\d+\)/);
    });

    it.concurrent('should fail with locally requested seed', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.prop([fc.constant(null)], { seed: 4242 })(
          'property fail with locally requested seed',
          (_unused) => false
        );
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectAlignedSeeds(out, { noAlignWithJest: true });
      expect(out).toMatch(/[×✕] property fail with locally requested seed \(with seed=4242\)/);
    });

    it.concurrent('should fail with globally requested seed', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
        fc.configureGlobal({ seed: 4848 });
        runner.prop([fc.constant(null)])('property fail with globally requested seed', (_unused) => false);
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectAlignedSeeds(out, { noAlignWithJest: true });
      expect(out).toMatch(/[×✕] property fail with globally requested seed \(with seed=4848\)/);
    });

    it.concurrent('should fail with seed requested at jest level', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
        runner.prop([fc.constant(null)])('property fail with globally requested seed', (_unused) => false);
      });

      // Act
      const out = await runSpec(jestConfigRelativePath, { jestSeed: 6969 });

      // Assert
      expectFail(out, specFileName);
      expectAlignedSeeds(out);
      expect(out).toMatch(/[×✕] property fail with globally requested seed \(with seed=6969\)/);
    });

    describe('.skip', () => {
      it.concurrent('should never be executed', async () => {
        // Arrange
        const { jestConfigRelativePath } = await writeToFile(runnerName, () => {
          runner.skip.prop([fc.constant(null)])('property never executed', (_unused) => false);
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expect(out).toMatch(/Test Suites:\s+1 skipped, 0 of 1 total/);
        expect(out).toMatch(/Tests:\s+1 skipped, 1 total/);
      });
    });

    describe('.failing', () => {
      it.concurrent('should pass because failing', async () => {
        // Arrange
        const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
          runner.failing.prop([fc.constant(null)])('property pass because failing', async (_unused) => false);
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expectPass(out, specFileName);
        expect(out).toMatch(/[√✓] property pass because failing \(with seed=-?\d+\)/);
      });

      it.concurrent('should fail because passing', async () => {
        // Arrange
        const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
          runner.failing.prop([fc.constant(null)])('property fail because passing', async (_unused) => true);
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expectFail(out, specFileName);
        expect(out).toMatch(/[×✕] property fail because passing \(with seed=-?\d+\)/);
      });
    });

    describe('.concurrent', () => {
      it.concurrent('should pass on truthy property', async () => {
        // Arrange
        const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
          runner.concurrent.prop([fc.constant(null)])('property pass on truthy property', (_unused) => true);
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expectPass(out, specFileName);
        expect(out).toMatch(/[√✓] property pass on truthy property \(with seed=-?\d+\)/);
      });

      it.concurrent('should fail on falsy property', async () => {
        // Arrange
        const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
          runner.concurrent.prop([fc.constant(null)])('property fail on falsy property', (_unused) => false);
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expectFail(out, specFileName);
        expectAlignedSeeds(out);
        expect(out).toMatch(/[×✕] property fail on falsy property \(with seed=-?\d+\)/);
      });

      describe('.failing', () => {
        it.concurrent('should pass because failing', async () => {
          // Arrange
          const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
            runner.concurrent.failing.prop([fc.constant(null)])(
              'property pass because failing',
              async (_unused) => false
            );
          });

          // Act
          const out = await runSpec(jestConfigRelativePath);

          // Assert
          expectPass(out, specFileName);
          expect(out).toMatch(/[√✓] property pass because failing \(with seed=-?\d+\)/);
        });

        it.concurrent('should fail because passing', async () => {
          // Arrange
          const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, () => {
            runner.concurrent.failing.prop([fc.constant(null)])(
              'property fail because passing',
              async (_unused) => true
            );
          });

          // Act
          const out = await runSpec(jestConfigRelativePath);

          // Assert
          expectFail(out, specFileName);
          expect(out).toMatch(/[×✕] property fail because passing \(with seed=-?\d+\)/);
        });
      });
    });
  }
);

// Helper

let num = -1;
async function writeToFile(
  runner: 'test' | 'it',
  fileContent: () => void
): Promise<{ specFileName: string; jestConfigRelativePath: string }> {
  const specFileSeed = Math.random().toString(16).substring(2);

  // Prepare test file itself
  const specFileName = `generated-${specFileSeed}-${++num}.spec.js`;
  const specFilePath = path.join(generatedTestsDirectory, specFileName);
  const fileContentString = String(fileContent);
  const wrapInDescribeIfNeeded =
    runner === 'it'
      ? (testCode: string) => `describe('test suite', () => {\n${testCode}\n});`
      : (testCode: string) => testCode;
  const specContent =
    "const fc = require('fast-check');\n" +
    `const {${runner}: runner} = require('@fast-check/jest');\n` +
    wrapInDescribeIfNeeded(
      fileContentString.substring(fileContentString.indexOf('{') + 1, fileContentString.lastIndexOf('}'))
    );

  // Prepare jest config itself
  const jestConfigName = `jest.config-${specFileSeed}.js`;
  const jestConfigRelativePath = `test/${generatedTestsDirectoryName}/${jestConfigName}`;
  const jestConfigPath = path.join(generatedTestsDirectory, jestConfigName);

  // Write the files
  await Promise.all([
    fs.writeFile(specFilePath, specContent),
    fs.writeFile(jestConfigPath, `module.exports = { testMatch: ['<rootDir>/${specFileName}'], transform: {} };`),
  ]);

  return { specFileName, jestConfigRelativePath };
}

async function runSpec(jestConfigRelativePath: string, opts: { jestSeed?: number } = {}): Promise<string> {
  const { stdout: jestBinaryPathCommand } = await execFile('yarn', ['bin', 'jest'], { shell: true });
  const jestBinaryPath = jestBinaryPathCommand.split('\n')[0];
  try {
    const { stderr: specOutput } = await execFile('node', [
      jestBinaryPath,
      '--config',
      jestConfigRelativePath,
      '--show-seed',
      ...(opts.jestSeed !== undefined ? ['--seed', String(opts.jestSeed)] : []),
    ]);
    return specOutput;
  } catch (err) {
    return (err as any).stderr;
  }
}

function expectPass(out: string, specFileName: string): void {
  expect(out).toMatch(new RegExp('PASS .*/' + specFileName));
}

function expectFail(out: string, specFileName: string): void {
  expect(out).toMatch(new RegExp('FAIL .*/' + specFileName));
}

function expectAlignedSeeds(out: string, opts: { noAlignWithJest?: boolean } = {}): void {
  // Seed printed by jest has the shape:
  // >   Seed:        -518086725
  // >   Test Suites: 1 failed, 1 total
  // >   Tests:       1 failed, 1 total
  // >   Snapshots:   0 total
  // >   Time:        0.952 s
  // >   Ran all test suites
  const JestSeedMatcher = /Seed:\s+(-?\d+)/;
  expect(out).toMatch(JestSeedMatcher);
  const jestSeed = JestSeedMatcher.exec(out)![1];
  // Seed printed by jest-fast-check next to test name has the shape:
  // >   × property fail on falsy property (with seed=-518086725)
  const JestFastCheckSeedMatcher = opts.noAlignWithJest
    ? /[×✕] .* \(with seed=(-?\d+)\)/
    : new RegExp('[×✕] .* \\(with seed=(' + jestSeed + ')\\)');
  expect(out).toMatch(JestFastCheckSeedMatcher);
  const jestFastCheckSeed = JestFastCheckSeedMatcher.exec(out)![1];
  // Seed printed by fast-check in case of failure has the shape:
  // >   Property failed after 1 tests
  // >   { seed: -518086725, path: \"0\", endOnFailure: true }
  expect(out).toMatch(new RegExp('\\{[^}]*seed\\s*:\\s*' + jestFastCheckSeed + '[^\\d]'));
}
