import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it } from 'vitest';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { failingProperty } from './__properties__/failing.mjs';
import { expectThrowWithCause } from './__test-helpers__/ThrowWithCause.js';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const testTimeout = 30000;
    const assertTimeout = 5000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should not timeout but report failing predicates',
      async () => {
        // Arrange
        const expectedError = /I'm a failing property/;

        // Act / Assert
        await expectThrowWithCause(assert(failingProperty, defaultOptions), expectedError);
      },
      testTimeout,
    );
  });
}
