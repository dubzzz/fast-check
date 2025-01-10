import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { propertyIsolation } from './__properties__/propertyIsolation.cjs';
import { expectThrowWithCause } from './__test-helpers__/ThrowWithCause.js';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should be able to isolate at property level with predicate level',
      async () => {
        // Arrange
        const options: Parameters<unknown> = { ...defaultOptions, numRuns: 3 }; // predicate level isolation is way longer to run
        await expect(assert(propertyIsolation.predicateLevelWarmUp, options)).resolves.not.toThrow();

        // Act / Assert
        await expect(assert(propertyIsolation.predicateLevelRun, options)).resolves.not.toThrow();
      },
      jestTimeout,
    );

    it(
      'should be able to isolate at property level with property level',
      async () => {
        // Arrange
        await expect(assert(propertyIsolation.propertyLevelWarmUp, defaultOptions)).resolves.not.toThrow();

        // Act / Assert
        await expect(assert(propertyIsolation.propertyLevelRun, defaultOptions)).resolves.not.toThrow();
      },
      jestTimeout,
    );

    it(
      'should be re-use the same worker across several properties when isolated at file level',
      async () => {
        // Arrange
        const expectedError = /Broken isolation, got: warm-up, for isolation level: file/;
        await expect(assert(propertyIsolation.fileLevelWarmUp, defaultOptions)).resolves.not.toThrow();

        // Act / Assert
        await expectThrowWithCause(assert(propertyIsolation.fileLevelRun, defaultOptions), expectedError);
      },
      jestTimeout,
    );
  });
}
