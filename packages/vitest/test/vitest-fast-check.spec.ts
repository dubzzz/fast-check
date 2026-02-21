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
declare const afterAllVi: typeof afterAll;
declare const beforeEachVi: typeof beforeEach;
declare const afterEachVi: typeof afterEach;

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

    it.concurrent(`should call beforeEach for each run in ${runnerName}.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        let beforeEachCount = 0;
        const requestedNumExecutions = 5;
        beforeEachVi(() => {
          ++beforeEachCount;
        });
        runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
          return true;
        });
        afterAllVi(() => {
          if (beforeEachCount !== requestedNumExecutions) {
            throw new Error('beforeEach count mismatch, got: ' + beforeEachCount);
          }
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent(`should call afterEach for each run in ${runnerName}.prop`, async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, () => {
        let afterEachCount = 0;
        const requestedNumExecutions = 5;
        afterEachVi(() => {
          ++afterEachCount;
        });
        runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
          return true;
        });
        afterAllVi(() => {
          if (afterEachCount !== requestedNumExecutions) {
            throw new Error('afterEach count mismatch, got: ' + afterEachCount);
          }
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
    });

    it.concurrent(
      `should never call beforeEach/afterEach twice per run in ${runnerName}.prop`,
      async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, () => {
          const requestedNumExecutions = 5;
          let beforeEachCount = 0;
          let afterEachCount = 0;
          const errors: string[] = [];

          beforeEachVi(() => {
            beforeEachCount++;
            if (beforeEachCount - afterEachCount !== 1) {
              errors.push('beforeEach: bE=' + beforeEachCount + ', aE=' + afterEachCount);
            }
          });
          afterEachVi(() => {
            afterEachCount++;
            if (beforeEachCount - afterEachCount !== 0) {
              errors.push('afterEach: bE=' + beforeEachCount + ', aE=' + afterEachCount);
            }
          });
          runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
            if (beforeEachCount - afterEachCount !== 1) {
              throw new Error('run: bE=' + beforeEachCount + ', aE=' + afterEachCount);
            }
            return true;
          });

          afterAllVi(() => {
            if (errors.length > 0) {
              throw new Error('Hook order violations: ' + errors.join('; '));
            }
            if (beforeEachCount !== requestedNumExecutions) {
              throw new Error('beforeEach count mismatch, got: ' + beforeEachCount);
            }
            if (afterEachCount !== requestedNumExecutions) {
              throw new Error('afterEach count mismatch, got: ' + afterEachCount);
            }
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectPass(out);
      },
    );

    it.concurrent(
      `should never call beforeEach/afterEach twice per run including shrinks in ${runnerName}.prop`,
      async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, () => {
          let beforeEachCount = 0;
          let afterEachCount = 0;
          const errors: string[] = [];

          beforeEachVi(() => {
            beforeEachCount++;
            if (beforeEachCount - afterEachCount !== 1) {
              errors.push('beforeEach: bE=' + beforeEachCount + ', aE=' + afterEachCount);
            }
          });
          afterEachVi(() => {
            afterEachCount++;
            if (beforeEachCount - afterEachCount !== 0) {
              errors.push('afterEach: bE=' + beforeEachCount + ', aE=' + afterEachCount);
            }
          });
          runner.fails.prop([fc.integer({ min: 10, max: 1000 })], { numRuns: 10 })(
            'property',
            (_n) => false,
          );

          afterAllVi(() => {
            if (errors.length > 0) {
              throw new Error('Hook order violations: ' + errors.join('; '));
            }
            if (beforeEachCount !== afterEachCount) {
              throw new Error('bE/aE mismatch: bE=' + beforeEachCount + ', aE=' + afterEachCount);
            }
            if (beforeEachCount < 1) {
              throw new Error('Expected at least 1 run, got: ' + beforeEachCount);
            }
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectPass(out);
      },
    );

    it.concurrent(
      `should call beforeEach cleanup functions for each run in ${runnerName}.prop`,
      async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, () => {
          let cleanupCount = 0;
          const requestedNumExecutions = 5;
          beforeEachVi(() => {
            return () => {
              ++cleanupCount;
            };
          });
          runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
            return true;
          });
          afterAllVi(() => {
            if (cleanupCount !== requestedNumExecutions) {
              throw new Error('beforeEach cleanup count mismatch, got: ' + cleanupCount);
            }
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectPass(out);
      },
    );

    it.concurrent(
      `should call beforeEach cleanup before afterEach between runs in ${runnerName}.prop`,
      async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, () => {
          const requestedNumExecutions = 5;
          let cleanupRan = false;
          let sawCleanupBeforeAfterEach = true;
          let transitions = 0;

          beforeEachVi(() => {
            cleanupRan = false;
            return () => {
              cleanupRan = true;
            };
          });
          afterEachVi(() => {
            transitions++;
            // Skip the first transition — its cleanup is managed by vitest auto-lifecycle,
            // not by our manual invocation, so ordering is outside our control.
            if (transitions > 1 && !cleanupRan) {
              sawCleanupBeforeAfterEach = false;
            }
          });
          runner.prop([fc.string()], { numRuns: requestedNumExecutions })('property', (_ignored) => {
            return true;
          });
          afterAllVi(() => {
            if (!sawCleanupBeforeAfterEach) {
              throw new Error('beforeEach cleanup was not called before afterEach');
            }
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
    "import {describe,afterAll as afterAllVi,beforeEach as beforeEachVi,afterEach as afterEachVi} from 'vitest';\n" +
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
