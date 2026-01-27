import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import type _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/jest';
import type { jest as _jest, expect as _jestExpect } from '@jest/globals';

const execFile = promisify(_execFile);

declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;
declare const jest: typeof _jest;
declare const jestExpect: typeof _jestExpect;

const generatedTestsDirectoryName = '.test-artifacts';
// @ts-expect-error --module must be higher
const generatedTestsDirectory = path.join(import.meta.dirname, '..', generatedTestsDirectoryName);

const specFileName = `generated.spec.mjs`;
const jestConfigName = `jest.config.mjs`;

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
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner('successful no prop', () => {
        jestExpect(true).toBe(true);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectPass(out);
    expect(out).toMatch(/[√✓] successful no prop/);
  });

  it.concurrent('should fail on failing no prop mode', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner('failing no prop', () => {
        jestExpect(false).toBe(true);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expect(out).toMatch(/[×✕] failing no prop/);
  });

  if (useWorkers) {
    it.concurrent('should fail on property blocking the main thread', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()], { timeout: 500 })('property block main thread', () => {
          while (true);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expect(out).toMatch(/[×✕] property block main thread/);
    });
  }

  it.concurrent('should pass on truthy synchronous property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.string(), fc.string(), fc.string()])('property pass sync', (a, b, c) => {
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectPass(out);
    expect(out).toMatch(/[√✓] property pass sync \(with seed=-?\d+\)/);
  });

  it.concurrent('should pass on truthy asynchronous property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.string(), fc.string(), fc.string()])('property pass async', async (a, b, c) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectPass(out);
    expect(out).toMatch(/[√✓] property pass async \(with seed=-?\d+\)/);
  });

  it.concurrent('should fail on falsy synchronous property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.nat()])('property fail sync', (a) => {
        return a === 0;
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail sync \(with seed=-?\d+\)/);
  });

  it.concurrent('should fail on falsy asynchronous property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.nat()])('property fail async', async (a) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return a === 0;
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail async \(with seed=-?\d+\)/);
  });

  it.concurrent('should pass on truthy record-based property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('property pass record', ({ a, b, c }) => {
        jestExpect(typeof a).toBe('string');
        jestExpect(typeof b).toBe('string');
        jestExpect(typeof c).toBe('string');
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectPass(out);
    expect(out).toMatch(/[√✓] property pass record \(with seed=-?\d+\)/);
  });

  it.concurrent('should fail on falsy record-based property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('property fail record', ({ a, b, c }) => {
        return `${a}${b}${c}`.includes(`${b}!`);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail record \(with seed=-?\d+\)/);
  });

  it.concurrent('should fail on falsy record-based property with seed', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop({ a: fc.string(), b: fc.string(), c: fc.string() }, { seed: 4869 })(
        'property fail record seeded',
        (_unused) => false,
      );
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out, { noAlignWithJest: true });
    expect(out).toMatch(/[×✕] property fail record seeded \(with seed=4869\)/);
  });

  it.concurrent('should fail with locally requested seed', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.constant(null)], { seed: 4242 })('property fail with locally requested seed', (_unused) => false);
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out, { noAlignWithJest: true });
    expect(out).toMatch(/[×✕] property fail with locally requested seed \(with seed=4242\)/);
  });

  it.concurrent('should fail with globally requested seed', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      fc.configureGlobal({ seed: 4848 });
      runner.prop([fc.constant(null)])('property fail with globally requested seed', (_unused) => false);
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out, { noAlignWithJest: true });
    expect(out).toMatch(/[×✕] property fail with globally requested seed \(with seed=4848\)/);
  });

  it.concurrent('should fail with seed requested at jest level', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.constant(null)])('property fail with globally requested seed', (_unused) => false);
    });

    // Act
    const out = await runSpec(specDirectory, { jestSeed: 6969 });

    // Assert
    expectFail(out);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail with globally requested seed \(with seed=6969\)/);
  });

  describe('.skip', () => {
    it.concurrent('should never be executed', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.skip.prop([fc.constant(null)])('property never executed', (_unused) => false);
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expect(out).toMatch(/Test Suites:\s+1 skipped, 0 of 1 total/);
      expect(out).toMatch(/Tests:\s+1 skipped, 1 total/);
    });
  });

  if (testRunner === undefined) {
    describe('.failing', () => {
      it.concurrent('should fail on successful no prop mode', async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, options, () => {
          runner.failing('successful no prop', () => {
            jestExpect(true).toBe(true);
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectFail(out);
        expect(out).toMatch(/[×✕] successful no prop/);
      });

      it.concurrent('should pass on failing no prop mode', async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, options, () => {
          runner.failing('failing no prop', () => {
            jestExpect(false).toBe(true);
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectPass(out);
        expect(out).toMatch(/[√✓] failing no prop/);
      });

      it.concurrent('should pass because failing', async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, options, () => {
          runner.failing.prop([fc.constant(null)])('property pass because failing', async (_unused) => false);
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectPass(out);
        expect(out).toMatch(/[√✓] property pass because failing \(with seed=-?\d+\)/);
      });

      it.concurrent('should fail because passing', async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, options, () => {
          runner.failing.prop([fc.constant(null)])('property fail because passing', async (_unused) => true);
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectFail(out);
        expect(out).toMatch(/[×✕] property fail because passing \(with seed=-?\d+\)/);
      });
    });
  }

  describe('.concurrent', () => {
    it.concurrent('should pass on truthy property', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.concurrent.prop([fc.constant(null)])('property pass on truthy property', (_unused) => true);
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
      expect(out).toMatch(/[√✓] property pass on truthy property \(with seed=-?\d+\)/);
    });

    it.concurrent('should fail on falsy property', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.concurrent.prop([fc.constant(null)])('property fail on falsy property', (_unused) => false);
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectAlignedSeeds(out);
      expect(out).toMatch(/[×✕] property fail on falsy property \(with seed=-?\d+\)/);
    });

    if (testRunner === undefined) {
      describe('.failing', () => {
        it.concurrent('should pass because failing', async () => {
          // Arrange
          const specDirectory = await writeToFile(runnerName, options, () => {
            runner.concurrent.failing.prop([fc.constant(null)])(
              'property pass because failing',
              async (_unused) => false,
            );
          });

          // Act
          const out = await runSpec(specDirectory);

          // Assert
          expectPass(out);
          expect(out).toMatch(/[√✓] property pass because failing \(with seed=-?\d+\)/);
        });

        it.concurrent('should fail because passing', async () => {
          // Arrange
          const specDirectory = await writeToFile(runnerName, options, () => {
            runner.concurrent.failing.prop([fc.constant(null)])(
              'property fail because passing',
              async (_unused) => true,
            );
          });

          // Act
          const out = await runSpec(specDirectory);

          // Assert
          expectFail(out);
          expect(out).toMatch(/[×✕] property fail because passing \(with seed=-?\d+\)/);
        });
      });
    }
  });

  describe('timeout', () => {
    it.concurrent('should fail as test takes longer than global Jest timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])('property takes longer than global Jest timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 5000);
      expect(out).toMatch(/[×✕] property takes longer than global Jest timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest local timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])(
          'property takes longer than Jest local timeout',
          async () => {
            await new Promise(() => {}); // never resolving
          },
          1000,
        );
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest local timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest config timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, { ...options, testTimeoutConfig: 1000 }, () => {
        runner.prop([fc.nat()])('property takes longer than Jest config timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest config timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest setTimeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(1000);
        }
        runner.prop([fc.nat()])('property takes longer than Jest setTimeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest setTimeout/);
    });

    it.concurrent('should fail as test takes longer than Jest CLI timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])('property takes longer than Jest CLI timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory, { testTimeoutCLI: 1000 });

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest CLI timeout/);
    });

    it.concurrent('should fail but favor local Jest timeout over Jest setTimeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
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
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000); // neither 2000 (setTimeout), nor 5000 (default)
      expect(out).toMatch(/[×✕] property favor local Jest timeout over Jest setTimeout/);
    });

    it.concurrent('should fail but favor Jest setTimeout over Jest CLI timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(1000);
        }
        runner.prop([fc.nat()])('property favor Jest setTimeout over Jest CLI timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory, { testTimeoutCLI: 2000 });

      // Assert
      expectFail(out);
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
): Promise<string> {
  const { useWorkers } = options;

  // Prepare directory for spec
  const specDirectorySeed = `${Math.random().toString(16).substring(2)}-${++num}`;
  const specDirectory = path.join(generatedTestsDirectory, `test-${specDirectorySeed}`);
  await fs.mkdir(specDirectory, { recursive: true });

  // Prepare test file itself
  const specFileName = `generated.spec.mjs`;
  const specFilePath = path.join(specDirectory, specFileName);
  let fileContentString = String(fileContent);
  if (fileContentString.includes('expect')) {
    // "expect" would be replaced by Vitest by "__vite_ssr_import_0__.expect"
    throw new Error('Drop any reference to expect to avoid running against the one from Vitest: use jestExpect');
  }
  fileContentString = fileContentString.replace(/jestExpect/g, 'expect');
  const wrapInDescribeIfNeeded =
    runner === 'it'
      ? (testCode: string) => `describe('test suite', () => {\n${testCode}\n});`
      : (testCode: string) => testCode;
  const importFromFastCheckJest = useWorkers
    ? `import {pathToFileURL} from 'node:url';\nimport {init as initWorker} from '@fast-check/jest/worker';\nconst {${runner}: runner, expect} = await initWorker(new URL(import.meta.url));\n`
    : `import {${runner} as runner} from '@fast-check/jest';\n`;
  const specContent =
    "import fc from 'fast-check';\n" +
    importFromFastCheckJest +
    wrapInDescribeIfNeeded(
      fileContentString.substring(fileContentString.indexOf('{') + 1, fileContentString.lastIndexOf('}')),
    );

  // Prepare jest config itself
  const jestConfigPath = path.join(specDirectory, jestConfigName);

  // Write the files
  await Promise.all([
    fs.writeFile(specFilePath, specContent),
    fs.writeFile(
      jestConfigPath,
      `export default { testMatch: ['<rootDir>/${specFileName}'], transform: {}, ${
        options.testTimeoutConfig !== undefined ? `testTimeout: ${options.testTimeoutConfig},` : ''
      }${options.testRunner !== undefined ? `testRunner: 'jest-jasmine2',` : ''} };`,
    ),
  ]);

  return specDirectory;
}

async function runSpec(
  specDirectory: string,
  opts: { jestSeed?: number; testTimeoutCLI?: number } = {},
): Promise<string> {
  try {
    const { stderr: specOutput } = await execFile(
      'node',
      [
        '--experimental-vm-modules',
        '../../node_modules/jest/bin/jest.js',
        '--config',
        jestConfigName,
        '--show-seed',
        ...(opts.jestSeed !== undefined ? ['--seed', String(opts.jestSeed)] : []),
        ...(opts.testTimeoutCLI !== undefined ? [`--testTimeout=${opts.testTimeoutCLI}`] : []),
      ],
      { cwd: specDirectory },
    );
    return specOutput;
  } catch (err) {
    return (err as any).stderr;
  }
}

function expectPass(out: string): void {
  expect(out).toMatch(new RegExp('PASS .*/' + specFileName));
}

function expectFail(out: string): void {
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
