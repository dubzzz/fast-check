import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import type { afterEach, beforeEach } from 'vitest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

    it.concurrent.only(`should call beforeEach in the right order`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        const requestedNumExecutions = 3;
        // @ts-expect-error - No type specified, but expected
        const probes = [];
        beforeEachVi(() => {
          probes.push(`beforeEach A`);
        });
        describeVi('describe', () => {
          beforeEachVi(() => {
            probes.push(`beforeEach AA`);
          });
          runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
            probes.push(`predicate`);
            return true;
          });
          beforeEachVi(() => {
            probes.push(`beforeEach BB`);
          });
        });
        beforeEachVi(() => {
          probes.push(`beforeEach B`);
        });
        afterAllVi(() => {
          // @ts-expect-error - No type specified, but expected
          expectVi(probes).toEqual([
            // outer level in order of declaration first
            'beforeEach A',
            'beforeEach B',
            // then inner level in order of declaration
            'beforeEach AA',
            'beforeEach BB',
            // then predicate
            'predicate',
            // and same for second run
            'beforeEach A',
            'beforeEach B',
            'beforeEach AA',
            'beforeEach BB',
            'predicate',
            // and same for third run
            'beforeEach A',
            'beforeEach B',
            'beforeEach AA',
            'beforeEach BB',
            'predicate',
          ]);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent.only(`should call afterEach in the right order`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        const requestedNumExecutions = 3;
        // @ts-expect-error - No type specified, but expected
        const probes = [];
        afterEachVi(() => {
          probes.push(`afterEach A`);
        });
        describeVi('describe', () => {
          afterEachVi(() => {
            probes.push(`afterEach AA`);
          });
          runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
            probes.push(`predicate`);
            return true;
          });
          afterEachVi(() => {
            probes.push(`afterEach BB`);
          });
        });
        afterEachVi(() => {
          probes.push(`afterEach B`);
        });
        afterAllVi(() => {
          // @ts-expect-error - No type specified, but expected
          expectVi(probes).toEqual([
            // predicate
            'predicate',
            // then inner level in reverse order of declaration
            'afterEach BB',
            'afterEach AA',
            // outer level in reverse order of declaration first
            'afterEach B',
            'afterEach A',
            // and same for second run
            'predicate',
            'afterEach BB',
            'afterEach AA',
            'afterEach B',
            'afterEach A',
            // and same for third run
            'predicate',
            'afterEach BB',
            'afterEach AA',
            'afterEach B',
            'afterEach A',
          ]);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent.only(`should call beforeEach clean-up in best-effort`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        const requestedNumExecutions = 3;
        // @ts-expect-error - No type specified, but expected
        const probes = [];
        beforeEachVi(() => {
          return () => probes.push(`clean-up beforeEach A`);
        });
        describeVi('describe', () => {
          beforeEachVi(() => {
            return () => probes.push(`clean-up beforeEach AA`);
          });
          runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
            probes.push(`predicate`);
            return true;
          });
          beforeEachVi(() => {
            return () => probes.push(`clean-up beforeEach BB`);
          });
        });
        beforeEachVi(() => {
          return () => probes.push(`clean-up beforeEach B`);
        });
        afterAllVi(() => {
          // @ts-expect-error - No type specified, but expected
          expectVi(probes).toEqual([
            // predicate
            'predicate',
            // and for second run: predicate then clean-up of beforeEach in reverse order
            'predicate',
            'clean-up beforeEach BB',
            'clean-up beforeEach AA',
            'clean-up beforeEach B',
            'clean-up beforeEach A',
            // and for third run: predicate then clean-up of beforeEach in reverse order
            'predicate',
            'clean-up beforeEach BB',
            'clean-up beforeEach AA',
            'clean-up beforeEach B',
            'clean-up beforeEach A',
            // Ideally these clean-ups should be executed earlier
            // late clean-ups for first run
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

    it.concurrent.only(
      `should call beforeEach/afterEach and clean-ups in proper order (at least for next runs)`,
      async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, () => {
          const requestedNumExecutions = 3;
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
              probes.push(`predicate`);
              return true;
            });
          });
          afterAllVi(() => {
            // @ts-expect-error - No type specified, but expected
            expectVi(probes).toEqual([
              // First run (except clean-ups for beforeEach)
              'beforeEach A',
              'beforeEach AA',
              'predicate',
              'afterEach AA',
              'afterEach A',
              // Second run
              'beforeEach A',
              'beforeEach AA',
              'predicate',
              'afterEach AA',
              'afterEach A',
              'clean-up beforeEach AA',
              'clean-up beforeEach BB',
              // Third run
              'beforeEach A',
              'beforeEach AA',
              'predicate',
              'afterEach AA',
              'afterEach A',
              'clean-up beforeEach AA',
              'clean-up beforeEach BB',
              // Clean-ups for first run
              'clean-up beforeEach AA',
              'clean-up beforeEach BB',
            ]);
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

async function runSpec(specDirectory: string, options?: { allowOnly?: boolean }): Promise<string> {
  try {
    const args = [
      '../../node_modules/vitest/vitest.mjs',
      '--config',
      vitestConfigName,
      '--run', // no watch
      '--no-color',
    ];
    if (options?.allowOnly) {
      args.push('--allowOnly');
    }
    const { stdout: specOutput } = await execFile('node', args, { cwd: specDirectory });
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
