import * as path from 'path';
import * as url from 'url';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import { jest } from '@jest/globals';

const execFile = promisify(_execFile);
// @ts-expect-error --module must be higher
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import type _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/jest';
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
  useWorkers: boolean;
  testRunner: 'jasmine' | undefined;
};

describe.each<DescribeOptions>([
  { specName: 'test', runnerName: 'test', useWorkers: false, testRunner: undefined },
  { specName: 'test (worker)', runnerName: 'test', useWorkers: true, testRunner: undefined },
  {
    specName: 'test (jasmine)',
    runnerName: 'test',
    useWorkers: false,
    testRunner: 'jasmine',
  },
  {
    specName: 'test (jasmine)(worker)',
    runnerName: 'test',
    useWorkers: true,
    testRunner: 'jasmine',
  },
  { specName: 'it', runnerName: 'it', useWorkers: false, testRunner: undefined },
])('$specName', ({ runnerName, useWorkers, testRunner }) => {
  const options = { useWorkers, testRunner };

  it.concurrent('should pass on successful no prop mode', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
      runner('successful no prop', () => {
        expect(true).toBe(true);
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectPass(out, specFileName);
    expect(out).toMatch(/[√✓] successful no prop/);
  });

  it.concurrent('should fail on failing no prop mode', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
      runner('failing no prop', () => {
        expect(false).toBe(true);
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectFail(out, specFileName);
    expect(out).toMatch(/[×✕] failing no prop/);
  });

  if (useWorkers) {
    it.concurrent('should fail on property blocking the main thread', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()], { timeout: 500 })('property block main thread', () => {
          while (true);
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expect(out).toMatch(/[×✕] property block main thread/);
    });
  }

  it.concurrent('should pass on truthy synchronous property', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
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
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
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
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
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
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
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

  it.concurrent('should pass on truthy record-based property', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
      runner.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('property pass record', ({ a, b, c }) => {
        expect(typeof a).toBe('string');
        expect(typeof b).toBe('string');
        expect(typeof c).toBe('string');
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectPass(out, specFileName);
    expect(out).toMatch(/[√✓] property pass record \(with seed=-?\d+\)/);
  });

  it.concurrent('should fail on falsy record-based property', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
      runner.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('property fail record', ({ a, b, c }) => {
        return `${a}${b}${c}`.includes(`${b}!`);
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectFail(out, specFileName);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail record \(with seed=-?\d+\)/);
  });

  it.concurrent('should fail on falsy record-based property with seed', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
      runner.prop({ a: fc.string(), b: fc.string(), c: fc.string() }, { seed: 4869 })(
        'property fail record seeded',
        (_unused) => false,
      );
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectFail(out, specFileName);
    expectAlignedSeeds(out, { noAlignWithJest: true });
    expect(out).toMatch(/[×✕] property fail record seeded \(with seed=4869\)/);
  });

  it.concurrent('should fail with locally requested seed', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
      runner.prop([fc.constant(null)], { seed: 4242 })('property fail with locally requested seed', (_unused) => false);
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
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
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
    const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
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
      const { jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
        runner.skip.prop([fc.constant(null)])('property never executed', (_unused) => false);
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expect(out).toMatch(/Test Suites:\s+1 skipped, 0 of 1 total/);
      expect(out).toMatch(/Tests:\s+1 skipped, 1 total/);
    });
  });

  if (testRunner === undefined) {
    describe('.failing', () => {
      it.concurrent('should fail on successful no prop mode', async () => {
        // Arrange
        const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
          runner.failing('successful no prop', () => {
            expect(true).toBe(true);
          });
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expectFail(out, specFileName);
        expect(out).toMatch(/[×✕] successful no prop/);
      });

      it.concurrent('should pass on failing no prop mode', async () => {
        // Arrange
        const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
          runner.failing('failing no prop', () => {
            expect(false).toBe(true);
          });
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expectPass(out, specFileName);
        expect(out).toMatch(/[√✓] failing no prop/);
      });

      it.concurrent('should pass because failing', async () => {
        // Arrange
        const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
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
        const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
          runner.failing.prop([fc.constant(null)])('property fail because passing', async (_unused) => true);
        });

        // Act
        const out = await runSpec(jestConfigRelativePath);

        // Assert
        expectFail(out, specFileName);
        expect(out).toMatch(/[×✕] property fail because passing \(with seed=-?\d+\)/);
      });
    });
  }

  describe('.concurrent', () => {
    it.concurrent('should pass on truthy property', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
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
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
        runner.concurrent.prop([fc.constant(null)])('property fail on falsy property', (_unused) => false);
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectAlignedSeeds(out);
      expect(out).toMatch(/[×✕] property fail on falsy property \(with seed=-?\d+\)/);
    });

    if (testRunner === undefined) {
      describe('.failing', () => {
        it.concurrent('should pass because failing', async () => {
          // Arrange
          const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
            runner.concurrent.failing.prop([fc.constant(null)])(
              'property pass because failing',
              async (_unused) => false,
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
          const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
            runner.concurrent.failing.prop([fc.constant(null)])(
              'property fail because passing',
              async (_unused) => true,
            );
          });

          // Act
          const out = await runSpec(jestConfigRelativePath);

          // Assert
          expectFail(out, specFileName);
          expect(out).toMatch(/[×✕] property fail because passing \(with seed=-?\d+\)/);
        });
      });
    }
  });

  describe('timeout', () => {
    it.concurrent('should fail as test takes longer than global Jest timeout', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])('property takes longer than global Jest timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectTimeout(out, 5000);
      expect(out).toMatch(/[×✕] property takes longer than global Jest timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest local timeout', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])(
          'property takes longer than Jest local timeout',
          async () => {
            await new Promise(() => {}); // never resolving
          },
          1000,
        );
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest local timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest config timeout', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(
        runnerName,
        { ...options, testTimeoutConfig: 1000 },
        () => {
          runner.prop([fc.nat()])('property takes longer than Jest config timeout', async () => {
            await new Promise(() => {}); // never resolving
          });
        },
      );

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest config timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest setTimeout', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(1000);
        }
        runner.prop([fc.nat()])('property takes longer than Jest setTimeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest setTimeout/);
    });

    it.concurrent('should fail as test takes longer than Jest CLI timeout', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])('property takes longer than Jest CLI timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath, { testTimeoutCLI: 1000 });

      // Assert
      expectFail(out, specFileName);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest CLI timeout/);
    });

    it.concurrent('should fail but favor local Jest timeout over Jest setTimeout', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(2000);
        }
        runner.prop([fc.nat()])(
          'property favor local Jest timeout over Jest setTimeout',
          async () => {
            await new Promise(() => {}); // never resolving
          },
          1000,
        );
      });

      // Act
      const out = await runSpec(jestConfigRelativePath);

      // Assert
      expectFail(out, specFileName);
      expectTimeout(out, 1000); // neither 2000 (setTimeout), nor 5000 (default)
      expect(out).toMatch(/[×✕] property favor local Jest timeout over Jest setTimeout/);
    });

    it.concurrent('should fail but favor Jest setTimeout over Jest CLI timeout', async () => {
      // Arrange
      const { specFileName, jestConfigRelativePath } = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(1000);
        }
        runner.prop([fc.nat()])('property favor Jest setTimeout over Jest CLI timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(jestConfigRelativePath, { testTimeoutCLI: 2000 });

      // Assert
      expectFail(out, specFileName);
      expectTimeout(out, 1000); // neither 2000 (cli), nor 5000 (default)
      expect(out).toMatch(/[×✕] property favor Jest setTimeout over Jest CLI timeout/);
    });
  });
});

// Helper

let num = -1;
async function writeToFile(
  runner: 'test' | 'it',
  options: { useWorkers: boolean; testTimeoutConfig?: number; testRunner?: 'jasmine' },
  fileContent: () => void,
): Promise<{ specFileName: string; jestConfigRelativePath: string }> {
  const { useWorkers } = options;
  const specFileSeed = Math.random().toString(16).substring(2);

  // Prepare test file itself
  const specFileName = `generated-${specFileSeed}-${++num}.spec.cjs`;
  const specFilePath = path.join(generatedTestsDirectory, specFileName);
  const fileContentString = String(fileContent);
  const wrapInDescribeIfNeeded =
    runner === 'it'
      ? (testCode: string) => `describe('test suite', () => {\n${testCode}\n});`
      : (testCode: string) => testCode;
  const importFromFastCheckJest = useWorkers
    ? `const {pathToFileURL} = require('node:url');\nconst {${runner}: runner, expect} = require('@fast-check/jest/worker').init(pathToFileURL(__filename));\n`
    : `const {${runner}: runner} = require('@fast-check/jest');\n`;
  const specContent =
    "const fc = require('fast-check');\n" +
    importFromFastCheckJest +
    wrapInDescribeIfNeeded(
      fileContentString.substring(fileContentString.indexOf('{') + 1, fileContentString.lastIndexOf('}')),
    );

  // Prepare jest config itself
  const jestConfigName = `jest.config-${specFileSeed}.cjs`;
  const jestConfigRelativePath = `test/${generatedTestsDirectoryName}/${jestConfigName}`;
  const jestConfigPath = path.join(generatedTestsDirectory, jestConfigName);

  // Write the files
  await Promise.all([
    fs.writeFile(specFilePath, specContent),
    fs.writeFile(
      jestConfigPath,
      `module.exports = { testMatch: ['<rootDir>/${specFileName}'], transform: {}, ${
        options.testTimeoutConfig !== undefined ? `testTimeout: ${options.testTimeoutConfig},` : ''
      }${options.testRunner !== undefined ? `testRunner: 'jest-jasmine2',` : ''} };`,
    ),
  ]);

  return { specFileName, jestConfigRelativePath };
}

async function runSpec(
  jestConfigRelativePath: string,
  opts: { jestSeed?: number; testTimeoutCLI?: number } = {},
): Promise<string> {
  const { stdout: jestBinaryPathCommand } = await execFile('yarn', ['bin', 'jest'], { shell: true });
  const jestBinaryPath = jestBinaryPathCommand.split('\n')[0];
  try {
    const { stderr: specOutput } = await execFile('node', [
      jestBinaryPath,
      '--config',
      jestConfigRelativePath,
      '--show-seed',
      ...(opts.jestSeed !== undefined ? ['--seed', String(opts.jestSeed)] : []),
      ...(opts.testTimeoutCLI !== undefined ? [`--testTimeout=${opts.testTimeoutCLI}`] : []),
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

function expectTimeout(out: string, timeout: number): void {
  expect(out).toContain('Property interrupted after 0 tests');
  const timeRegex = /[×✕] .* \(with seed=-?\d+\) \((\d+) ms\)/;
  expect(out).toMatch(timeRegex);
  const time = timeRegex.exec(out)!;
  expect(Number(time[1])).toBeGreaterThanOrEqual(timeout);
  expect(Number(time[1])).toBeLessThan(timeout * 1.5);
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
