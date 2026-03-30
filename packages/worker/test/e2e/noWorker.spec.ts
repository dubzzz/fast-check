import { isMainThread } from 'node:worker_threads';
import fc, { type Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';
import { expectThrowWithCause } from './__test-helpers__/ThrowWithCause.js';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const testTimeout = 30000;
    const assertTimeout = 5000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should be able to run any basic successful property',
      async () => {
        // Arrange
        const property = fc.property(fc.nat(), () => true);

        // Act / Assert
        await expect(assert(property, defaultOptions)).resolves.not.toThrow();
      },
      testTimeout,
    );

    it(
      'should be able to run any basic failing property',
      async () => {
        // Arrange
        const property = fc.property(fc.nat(), () => false);
        const expectedError = /Property failed by returning false/;

        // Act / Assert
        await expectThrowWithCause(assert(property, defaultOptions), expectedError);
      },
      testTimeout,
    );
  });
}
