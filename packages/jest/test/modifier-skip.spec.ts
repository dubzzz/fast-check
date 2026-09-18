import { describe, it, expect } from 'vitest';
import type * as _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/jest';
import { writeToFile, runSpec } from './__test-helpers__/RunJest.js';
import { runOptions } from './__test-helpers__/RunOptions.js';

declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;

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
});
