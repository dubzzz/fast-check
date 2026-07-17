import { isMainThread } from 'node:worker_threads';
import * as fc from 'fast-check';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';
import { expectThrowWithCause } from './__test-helpers__/ThrowWithCause.js';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const testTimeout = 30000;
    const assertTimeout = 5000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it.each`
      type                               | sync
      ${'property with sync predicate'}  | ${true}
      ${'property with async predicate'} | ${false}
    `(
      'should be able to run any basic successful $type',
      async ({ sync }) => {
        // Arrange
        const property = sync ? fc.asyncProperty(fc.nat(), () => true) : fc.asyncProperty(fc.nat(), async () => true);

        // Act / Assert
        await expect(assert(property, defaultOptions)).resolves.not.toThrow();
      },
      testTimeout,
    );

    it.each`
      type                               | sync
      ${'property with sync predicate'}  | ${true}
      ${'property with async predicate'} | ${false}
    `(
      'should be able to run any basic failing $type',
      async ({ sync }) => {
        // Arrange
        const property = sync ? fc.asyncProperty(fc.nat(), () => false) : fc.asyncProperty(fc.nat(), async () => false);
        const expectedError = /Property failed by returning false/;

        // Act / Assert
        await expectThrowWithCause(assert(property, defaultOptions), expectedError);
      },
      testTimeout,
    );
  });
}
