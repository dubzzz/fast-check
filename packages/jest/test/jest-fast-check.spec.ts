import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import * as path from 'path';
import { createHash } from 'crypto';
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
const generatedTestsDirectory = path.join(import.meta.dirname, '..', generatedTestsDirectoryName);

const specFileName = `generated.spec.cjs`;
const jestConfigName = `jest.config.cjs`;

type RunnerType = 'test' | 'it';

// Batches (see runSpec) can only aggregate specs of tests running concurrently: the default cap of 5 would limit them to 5 specs
vi.setConfig({ maxConcurrency: 200 });

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

describe.concurrent.each<DescribeOptions>([
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
      const out = await runSpec(specDirectory, { solo: true }); // solo: assertions below are on run-global counts

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
          jest.setTimeout(3000);
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
      expectTimeout(out, 1000); // neither 3000 (setTimeout), nor 5000 (default)
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
      const out = await runSpec(specDirectory, { testTimeoutCLI: 3000 });

      // Assert
      expectFail(out);
      expectTimeout(out, 1000); // neither 3000 (cli), nor 5000 (default)
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

  // Prepare jest config itself
  const jestConfig = {
    testMatch: [`<rootDir>/*/${specFileName}`],
    transform: {},
    testTimeout: options.testTimeoutConfig,
    testRunner: options.testRunner !== undefined ? 'jest-jasmine2' : undefined,
    ...(useWorkers
      ? {
          transform: { '^.+\\.[t|j]sx?$': 'babel-jest' },
          transformIgnorePatterns: ['/node_modules/(?!(?:@fast-check/worker)/)'],
        }
      : {}),
  };

  // Prepare babel config (if needed)
  const babelConfig = useWorkers
    ? `module.exports = { presets: [['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]], };`
    : undefined;

  // Prepare directory for spec: specs sharing the exact same configuration live in the same group directory,
  // the configuration files being written once at the group level (allows batched runs, see runSpec)
  const groupFingerprint = createHash('sha1').update(JSON.stringify({ jestConfig, babelConfig })).digest('hex');
  const groupDirectory = path.join(generatedTestsDirectory, `group-${groupFingerprint.substring(0, 8)}`);
  const specDirectorySeed = `${Math.random().toString(16).substring(2)}-${++num}`;
  const specDirectory = path.join(groupDirectory, `test-${specDirectorySeed}`);
  await fs.mkdir(specDirectory, { recursive: true });

  // Prepare test file itself
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
    ? `const {pathToFileURL} = require('node:url');\nconst {${runner}: runner, expect} = require('@fast-check/jest/worker').init(pathToFileURL(__filename));\n`
    : `const {${runner}: runner} = require('@fast-check/jest');\n`;
  const specContent =
    "const fc = require('fast-check');\n" +
    importFromFastCheckJest +
    wrapInDescribeIfNeeded(
      fileContentString.substring(fileContentString.indexOf('{') + 1, fileContentString.lastIndexOf('}')),
    );

  // Write the files
  await Promise.all([
    fs.writeFile(specFilePath, specContent),
    writeFileOnce(path.join(groupDirectory, jestConfigName), `module.exports = ${JSON.stringify(jestConfig)};`),
    ...(babelConfig !== undefined ? [writeFileOnce(path.join(groupDirectory, 'babel.config.cjs'), babelConfig)] : []),
  ]);

  return specDirectory;
}

function writeFileOnce(filePath: string, content: string): Promise<void> {
  return fs.writeFile(filePath, content, { flag: 'wx' }).catch((err) => {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err;
    }
  });
}

// Environment with AI agent env vars removed so that Jest uses its default reporter
// instead of the AgentReporter (which strips verbose test result markers).
const jestEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !['AI_AGENT', 'AUGMENT_AGENT', 'CLAUDE_CODE', 'CLAUDECODE', 'CODEX_SANDBOX', 'CODEX_THREAD_ID'].includes(key) &&
      !['CURSOR_AGENT', 'GEMINI_CLI', 'GOOSE_PROVIDER', 'OPENCODE', 'REPL_ID'].includes(key),
  ),
);

// Booting one Jest process per spec is by far the main cost of this file. Specs sharing the same configuration
// (ie. same group directory, see writeToFile) and the same CLI options can share a single Jest process: runSpec
// only fires the process after a short delay so that all the concurrently requested specs join the same run,
// each caller receiving the part of the output related to its own spec.
type PendingSpec = { specDirectory: string; resolve: (out: string) => void };
const pendingBatches = new Map<string, { specs: PendingSpec[]; timer: ReturnType<typeof setTimeout> }>();
const batchDelayMs = 250;

async function runSpec(
  specDirectory: string,
  opts: { jestSeed?: number; testTimeoutCLI?: number; solo?: boolean } = {},
): Promise<string> {
  const groupDirectory = path.dirname(specDirectory);
  const cliArgs = [
    '--show-seed',
    '--verbose', // print one line per test even for specs passing within a run of many specs
    ...(opts.jestSeed !== undefined ? ['--seed', String(opts.jestSeed)] : []),
    ...(opts.testTimeoutCLI !== undefined ? [`--testTimeout=${opts.testTimeoutCLI}`] : []),
  ];
  if (opts.solo) {
    // For assertions relying on run-global outputs (eg. counts in the summary): keep a dedicated run for the spec
    return execJest(groupDirectory, cliArgs, [specDirectory]);
  }
  const batchKey = JSON.stringify([groupDirectory, cliArgs]);
  return new Promise((resolve) => {
    let batch = pendingBatches.get(batchKey);
    if (batch === undefined) {
      batch = { specs: [], timer: setTimeout(() => {}, 0) };
      pendingBatches.set(batchKey, batch);
    }
    batch.specs.push({ specDirectory, resolve });
    clearTimeout(batch.timer);
    batch.timer = setTimeout(() => {
      pendingBatches.delete(batchKey);
      void runBatch(groupDirectory, cliArgs, batch.specs);
    }, batchDelayMs);
  });
}

async function runBatch(groupDirectory: string, cliArgs: string[], specs: PendingSpec[]): Promise<void> {
  const out = await execJest(
    groupDirectory,
    cliArgs,
    specs.map((spec) => spec.specDirectory),
  );
  for (const spec of specs) {
    spec.resolve(extractSpecOutput(out, path.basename(spec.specDirectory)));
  }
}

async function execJest(groupDirectory: string, cliArgs: string[], specDirectories: string[]): Promise<string> {
  try {
    const { stderr: specOutput } = await execFile(
      'node',
      [
        '../../node_modules/jest/bin/jest.js',
        '--config',
        jestConfigName,
        ...cliArgs,
        // Regex patterns restricting the run to the requested specs only
        ...specDirectories.map((dir) => `${path.basename(dir)}/`),
      ],
      { cwd: groupDirectory, env: jestEnv },
    );
    return specOutput;
  } catch (err) {
    return (err as any).stderr;
  }
}

// Extracts from the output of a batched run the parts related to a single spec: its own PASS/FAIL block (status,
// per-test results and failure details are printed contiguously for each spec file) and the run-global footer
// (holding the Seed among others). Other blocks, including the "Summary of all failing tests", are dropped.
function extractSpecOutput(out: string, specDirectoryName: string): string {
  const lines = out.split('\n');
  const isBlockStart = (line: string) => /^\s*(PASS|FAIL)\s/.test(line);
  const start = lines.findIndex((line) => isBlockStart(line) && line.includes(`${specDirectoryName}/`));
  if (start === -1) {
    return ''; // no output attributable to this spec: fail loudly rather than match against another spec
  }
  let end = start + 1;
  while (
    end < lines.length &&
    !isBlockStart(lines[end]) &&
    !/^(Summary of all failing tests|Seed:|Test Suites:)/.test(lines[end])
  ) {
    ++end;
  }
  const footerStart = lines.findIndex((line) => /^Seed:\s/.test(line));
  return lines
    .slice(start, end)
    .concat(footerStart !== -1 ? lines.slice(footerStart) : [])
    .join('\n');
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
  // The reported time also includes some fixed overhead (worker spawn, transforms...) that does not scale with
  // the timeout: an additive margin stays below the closest other candidate timeout (they are 2000ms apart at least)
  expect(Number(time[1])).toBeLessThan(timeout + 1900);
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
