import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
const execFile = promisify(_execFile);

import _fc from 'fast-check';
import { testProp as _testProp, itProp as _itProp } from '@fast-check/jest';
declare const fc: typeof _fc;
declare const runnerProp: typeof _testProp | typeof _itProp;

const generatedTestsDirectoryName = 'generated-tests';
const generatedTestsDirectory = path.join(__dirname, generatedTestsDirectoryName);

type RunnerType = 'testProp' | 'itProp';

jest.setTimeout(60_000);

beforeAll(async () => {
  await fs.mkdir(generatedTestsDirectory, { recursive: true });
});
afterAll(async () => {
  await fs.rm(generatedTestsDirectory, { recursive: true });
});

describe.each<{ runner: RunnerType }>([{ runner: 'testProp' }, { runner: 'itProp' }])('$runner', ({ runner }) => {
  it.concurrent('should pass on truthy synchronous property', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      runnerProp('property pass sync', [fc.string(), fc.string(), fc.string()], (a, b, c) => {
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
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      runnerProp('property pass async', [fc.string(), fc.string(), fc.string()], async (a, b, c) => {
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
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      runnerProp('property fail sync', [fc.nat()], (a) => {
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
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      runnerProp('property fail async', [fc.nat()], async (a) => {
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
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      runnerProp('property fail with locally requested seed', [fc.constant(null)], (_unused) => false, {
        seed: 4242,
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectFail(out, specFileName);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail with locally requested seed \(with seed=4242\)/);
  });

  it.concurrent('should fail with globally requested seed', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      fc.configureGlobal({ seed: 4848 });
      runnerProp('property fail with globally requested seed', [fc.constant(null)], (_unused) => false);
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectFail(out, specFileName);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail with globally requested seed \(with seed=4848\)/);
  });

  describe('.skip', () => {
    it.concurrent('should never be executed', async () => {
      // Arrange
      const { jestConfigRelativePath } = await writeToFile(runner, () => {
        runnerProp.skip('property never executed', [fc.constant(null)], (_unused) => false);
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
      const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
        runnerProp.failing('property pass because failing', [fc.constant(null)], async (_unused) => false);
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectPass(out, specFileName);
      expect(out).toMatch(/[√✓] property pass because failing \(with seed=-?\d+\)/);
    });

    it.concurrent('should fail because passing', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
        runnerProp.failing('property fail because passing', [fc.constant(null)], async (_unused) => true);
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
      const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
        runnerProp.concurrent('property pass on truthy property', [fc.constant(null)], (_unused) => true);
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectPass(out, specFileName);
      expect(out).toMatch(/[√✓] property pass on truthy property \(with seed=-?\d+\)/);
    });

    it.concurrent('should fail on falsy property', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
        runnerProp.concurrent('property fail on falsy property', [fc.constant(null)], (_unused) => false);
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
        const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
          runnerProp.concurrent.failing('property pass because failing', [fc.constant(null)], async (_unused) => false);
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expectPass(out, specFileName);
        expect(out).toMatch(/[√✓] property pass because failing \(with seed=-?\d+\)/);
      });

      it.concurrent('should fail because passing', async () => {
        // Arrange
        const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
          runnerProp.concurrent.failing('property fail because passing', [fc.constant(null)], async (_unused) => true);
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expectFail(out, specFileName);
        expect(out).toMatch(/[×✕] property fail because passing \(with seed=-?\d+\)/);
      });
    });
  });
});

// Helper

let num = -1;
async function writeToFile(
  runner: 'testProp' | 'itProp',
  fileContent: () => void
): Promise<{ specFileName: string; jestConfigRelativePath: string }> {
  const specFileSeed = Math.random().toString(16).substring(2);

  // Prepare test file itself
  const specFileName = `generated-${specFileSeed}-${++num}.spec.js`;
  const specFilePath = path.join(generatedTestsDirectory, specFileName);
  const fileContentString = String(fileContent);
  const wrapInDescribeIfNeeded =
    runner === 'itProp'
      ? (testCode: string) => `describe('test suite', () => {\n${testCode}\n});`
      : (testCode: string) => testCode;
  const specContent =
    "const fc = require('fast-check');\n" +
    `const {${runner}: runnerProp} = require('@fast-check/jest');\n` +
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
    fs.writeFile(
      jestConfigPath,
      `module.exports = { testMatch: ['<rootDir>/${specFileName}'], transform: {} };`
    ),
  ]);

  return { specFileName, jestConfigRelativePath };
}

async function runSpec(jestConfigRelativePath: string): Promise<string> {
  const { stdout: jestBinaryPathCommand } = await execFile('yarn', ['bin', 'jest'], { shell: true });
  const jestBinaryPath = jestBinaryPathCommand.split('\n')[0];
  try {
    const { stderr: specOutput } = await execFile('node', [jestBinaryPath, '--config', jestConfigRelativePath]);
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

function expectAlignedSeeds(out: string): void {
  expect(out).toMatch(/[×✕] .* \(with seed=-?\d+\)/);
  const receivedSeed = out.split('seed=')[1].split(')')[0];
  expect(out).toMatch(new RegExp('seed\\s*:\\s*' + receivedSeed + '[^\\d]'));
}
