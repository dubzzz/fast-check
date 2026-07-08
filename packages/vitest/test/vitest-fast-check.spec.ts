import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import type { afterEach, beforeEach } from 'vitest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const execFile = promisify(_execFile);

import type _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/vitest';
declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;
declare const describeVi: typeof describe;
declare const afterAllVi: typeof afterAll;
declare const beforeEachVi: typeof beforeEach;
declare const afterEachVi: typeof afterEach;
declare const expectVi: typeof expect;

const generatedTestsDirectoryName = '.test-artifacts';
const generatedTestsDirectory = path.join(import.meta.dirname, '..', generatedTestsDirectoryName);
const specFileName = `generated.spec.mjs`;
const vitestConfigName = `vitest.config.mjs`;

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
};

describe.concurrent.each<DescribeOptions>([
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

    it.concurrent(`should support ${runnerName}.only.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.only.prop([fc.string(), fc.string(), fc.string()])('property', (a, b, c) => {
          return `${a}${b}${c}`.includes(b);
        });
      });

      // Act
      const out = await runSpec(specDirectory, { allowOnly: true });

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

    it.concurrent(`should take into account local numRuns in ${runnerName}.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        let numExecutions = 0;
        const requestedNumExecutions = 5;
        runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
          ++numExecutions;
          if (numExecutions > requestedNumExecutions) {
            throw new Error('Breach on numRuns');
          }
          return true;
        });
        afterAllVi(() => {
          if (numExecutions !== requestedNumExecutions) {
            throw new Error('Breach on numRuns, got: ' + numExecutions);
          }
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent(`should call beforeEach, afterEach and clean-ups in proper order`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        const requestedNumExecutions = 4;
        let runId = 0;
        // @ts-expect-error - No type specified, but expected
        const probes = [];
        beforeEachVi(() => {
          probes.push(`beforeEach A`);
          return () => probes.push(`clean-up beforeEach A`);
        });
        afterEachVi(() => {
          probes.push(`afterEach A`);
        });
        describeVi('describe', () => {
          beforeEachVi(() => {
            probes.push(`beforeEach AA`);
            return () => probes.push(`clean-up beforeEach AA`);
          });
          afterEachVi(() => {
            probes.push(`afterEach AA`);
          });
          runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
            probes.push(`predicate ${++runId}`);
            return true;
          });
          beforeEachVi(() => {
            probes.push(`beforeEach BB`);
            return () => probes.push(`clean-up beforeEach BB`);
          });
          afterEachVi(() => {
            probes.push(`afterEach BB`);
          });
        });
        beforeEachVi(() => {
          probes.push(`beforeEach B`);
          return () => probes.push(`clean-up beforeEach B`);
        });
        afterEachVi(() => {
          probes.push(`afterEach B`);
        });
        afterAllVi(() => {
          // @ts-expect-error - No type specified, but expected
          expectVi(probes).toEqual([
            // WARNING: First and last run behave differently from other runs!
            // Normal order being:
            // - beforeEach from outer-most level to inner level in order of declaration
            // - test itself
            // - afterEach from inner-most level to outer level in reversed order of declaration
            // - clean-ups for beforeEach from inner-most level to outer level in reversed order of declaration
            // First run: clean-ups of beforeEach are delayed to the end
            'beforeEach A',
            'beforeEach B',
            'beforeEach AA',
            'beforeEach BB',
            'predicate 1',
            'afterEach BB',
            'afterEach AA',
            'afterEach B',
            'afterEach A',
            // Second run
            'beforeEach A',
            'beforeEach B',
            'beforeEach AA',
            'beforeEach BB',
            'predicate 2',
            'afterEach BB',
            'afterEach AA',
            'afterEach B',
            'afterEach A',
            'clean-up beforeEach BB',
            'clean-up beforeEach AA',
            'clean-up beforeEach B',
            'clean-up beforeEach A',
            // Third run
            'beforeEach A',
            'beforeEach B',
            'beforeEach AA',
            'beforeEach BB',
            'predicate 3',
            'afterEach BB',
            'afterEach AA',
            'afterEach B',
            'afterEach A',
            'clean-up beforeEach BB',
            'clean-up beforeEach AA',
            'clean-up beforeEach B',
            'clean-up beforeEach A',
            // Fourth run: we let Vitest handling the afterEach for this run
            'beforeEach A',
            'beforeEach B',
            'beforeEach AA',
            'beforeEach BB',
            'predicate 4',
            'clean-up beforeEach BB',
            'clean-up beforeEach AA',
            'clean-up beforeEach B',
            'clean-up beforeEach A',
            // Vitest handling: clean-ups for first run and afterEach for last one
            'afterEach BB',
            'afterEach AA',
            'afterEach B',
            'afterEach A',
            'clean-up beforeEach BB',
            'clean-up beforeEach AA',
            'clean-up beforeEach B',
            'clean-up beforeEach A',
          ]);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent(
      `should call beforeEach, afterEach and clean-ups the same number of times even in failure cases`,
      async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, () => {
          // @ts-expect-error - No Typescript here
          const probes = [];
          beforeEachVi(() => {
            probes.push(`beforeEach`);
            return () => probes.push(`clean-up beforeEach`);
          });
          afterEachVi(() => {
            probes.push(`afterEach`);
          });
          runner.fails.prop([fc.string()])('property', (s) => {
            probes.push(`predicate`);
            return s.length % 2 === 0;
          });
          afterAllVi(() => {
            // @ts-expect-error - No Typescript here
            const counOf = (value) => probes.filter((v) => v === value).length;
            expectVi(counOf('beforeEach')).toBe(counOf('predicate'));
            expectVi(counOf('afterEach')).toBe(counOf('predicate'));
            expectVi(counOf('clean-up beforeEach')).toBe(counOf('predicate'));
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectPass(out);
      },
    );

    it.concurrent(`should take into account configureGlobal numRuns in ${runnerName}.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        let numExecutions = 0;
        const requestedNumExecutions = 5;
        fc.configureGlobal({ numRuns: requestedNumExecutions });
        runner.prop([fc.string()])('property', (_ignored) => {
          ++numExecutions;
          if (numExecutions > requestedNumExecutions) {
            throw new Error('Breach on numRuns');
          }
          return true;
        });
        afterAllVi(() => {
          fc.resetConfigureGlobal(); // batched runs (see runSpec) do not isolate specs: avoid leaking the config to others
          if (numExecutions !== requestedNumExecutions) {
            throw new Error('Breach on numRuns, got: ' + numExecutions);
          }
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
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
      const out = await runSpec(specDirectory, { allowOnly: true });

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

  describe('.each', () => {
    it.concurrent(`should support ${runnerName}.each`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner.each([1, 2, 3])('property %i', (i) => {
          expectVi(i).toBe(i);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });
  });

  describe('without .prop', () => {
    it.concurrent(`should support ${runnerName} without any use of the generator on success`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner('no gen', () => {});
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent(
      `should support ${runnerName} without any use of the generator on failure but not report it via fast-check`,
      async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, () => {
          runner('no gen', () => {
            throw new Error('Expect 2 to equal 1');
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectFail(out);
        expect(out).toContain('Expect 2 to equal 1');
        expect(out).not.toContain('Property failed after 1 tests');
      },
    );

    it.concurrent(`should support ${runnerName} using the generator on success`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        runner('no gen', ({ g }) => {
          const value = g(() => fc.constant(0));
          if (value !== 0) {
            throw new Error(`Expect ${value} to equal 0`);
          }
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent(
      `should support ${runnerName} using the generator on failure and report it using fast-check`,
      async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, () => {
          runner('no gen', ({ g }) => {
            const value: number = g(() => fc.constant(2));
            if (value !== 1) {
              throw new Error(`Expect ${value} to equal 1`);
            }
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectFail(out);
        expect(out).toContain('Expect 2 to equal 1');
        expect(out).toContain('Property failed after 1 tests');
      },
    );
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
    "import {describe,describe as describeVi,afterAll as afterAllVi,beforeEach as beforeEachVi,afterEach as afterEachVi,expect as expectVi} from 'vitest';\n" +
    "import * as fc from 'fast-check';\n" +
    importFromFastCheckVitest +
    wrapInDescribeIfNeeded(
      fileContentString.substring(fileContentString.indexOf('{') + 1, fileContentString.lastIndexOf('}')),
    );

  // Write the files (the config being common to all the specs, it is written once at the root of the specs)
  await Promise.all([
    fs.writeFile(specFilePath, specContent),
    writeFileOnce(
      path.join(generatedTestsDirectory, vitestConfigName),
      `import { defineConfig } from 'vite';\n` +
        `export default defineConfig({ test: { include: ['*/${specFileName}'], }, });`,
    ),
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

// Environment with AI agent env vars removed so that vitest uses its default reporter
// instead of the AgentReporter (which strips verbose test result markers).
const vitestEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !['AI_AGENT', 'AUGMENT_AGENT', 'CLAUDE_CODE', 'CLAUDECODE', 'CODEX_SANDBOX', 'CODEX_THREAD_ID'].includes(key) &&
      !['CURSOR_AGENT', 'GEMINI_CLI', 'GOOSE_PROVIDER', 'OPENCODE', 'REPL_ID'].includes(key),
  ),
);

// Booting one Vitest process per spec is by far the main cost of this file. Specs requested with the same CLI
// options can share a single Vitest process: runSpec only fires the process after a short delay so that all the
// concurrently requested specs join the same run, each caller receiving the part of the output related to its
// own spec.
type PendingSpec = { specDirectory: string; resolve: (out: string) => void };
const pendingBatches = new Map<string, { specs: PendingSpec[]; timer: ReturnType<typeof setTimeout> }>();
const batchDelayMs = 250;

async function runSpec(specDirectory: string, options?: { allowOnly?: boolean }): Promise<string> {
  const cliArgs = [
    '--run', // no watch
    '--no-color',
    '--no-isolate', // re-importing fast-check in a fresh process for each spec would be the main cost of the run
    ...(options?.allowOnly ? ['--allowOnly'] : []),
  ];
  const batchKey = JSON.stringify(cliArgs);
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
      void runBatch(cliArgs, batch.specs);
    }, batchDelayMs);
  });
}

async function runBatch(cliArgs: string[], specs: PendingSpec[]): Promise<void> {
  let out: string;
  try {
    const { stdout, stderr } = await execFile(
      'node',
      [
        '../node_modules/vitest/vitest.mjs',
        '--config',
        vitestConfigName,
        ...cliArgs,
        // Filters restricting the run to the requested specs only
        ...specs.map((spec) => `${path.basename(spec.specDirectory)}/`),
      ],
      { cwd: generatedTestsDirectory, env: vitestEnv },
    );
    out = `${stdout}\n${stderr}`;
  } catch (err) {
    out = `${(err as any).stdout}\n${(err as any).stderr}`;
  }
  for (const spec of specs) {
    spec.resolve(extractSpecOutput(out, path.basename(spec.specDirectory)));
  }
}

// Extracts from the output of a batched run the parts related to a single spec: the per-file reporter lines
// mention the file explicitly, while the detailed failure blocks all start with a FAIL header naming their file.
// The directory of the spec is finally dropped from the paths so that assertions can refer to the spec file name.
function extractSpecOutput(out: string, specDirectoryName: string): string {
  const kept: string[] = [];
  let insideOwnFailureBlock = false;
  for (const line of out.split('\n')) {
    if (/(^|\s)FAIL\s/.test(line)) {
      insideOwnFailureBlock = line.includes(`${specDirectoryName}/`);
    } else if (/^\s*(Test Files|Tests|Errors)\s/.test(line)) {
      insideOwnFailureBlock = false; // reached the run-global summary
    }
    if (insideOwnFailureBlock || line.includes(`${specDirectoryName}/`)) {
      kept.push(line);
    }
  }
  return kept.join('\n').split(`${specDirectoryName}/`).join('');
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
