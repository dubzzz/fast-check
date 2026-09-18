import { describe, it, expect } from 'vitest';
import type * as _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/jest';
import type { expect as _jestExpect } from '@jest/globals';
import { writeToFile, runSpec, expectPass, expectFail } from './__test-helpers__/RunJest.js';
import { runOptions } from './__test-helpers__/RunOptions.js';

declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;
declare const jestExpect: typeof _jestExpect;

describe.each(runOptions)('$specName', ({ runnerName, useWorkers, testRunner }) => {
  const options = { useWorkers, testRunner };

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
});
