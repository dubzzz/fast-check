import { isMainThread } from 'node:worker_threads';
import fc, { type Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';
import { expectThrowWithCause } from './__test-helpers__/ThrowWithCause.js';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it.each`
      type               | sync
      ${'property'}      | ${true}
      ${'asyncProperty'} | ${false}
    `(
      'should be able to run any basic successful $type',
      async ({ sync }) => {
        // Arrange
        const property = sync ? fc.property(fc.nat(), () => true) : fc.asyncProperty(fc.nat(), async () => true);

        // Act / Assert
        await expect(assert(property, defaultOptions)).resolves.not.toThrow();
      },
      jestTimeout,
    );

    it.each`
      type               | sync
      ${'property'}      | ${true}
      ${'asyncProperty'} | ${false}
    `(
      'should be able to run any basic failing $type',
      async ({ sync }) => {
        // Arrange
        const property = sync ? fc.property(fc.nat(), () => false) : fc.asyncProperty(fc.nat(), async () => false);
        const expectedError = /Property failed by returning false/;

        // Act / Assert
        await expectThrowWithCause(assert(property, defaultOptions), expectedError);
      },
      jestTimeout,
    );
  });
}
