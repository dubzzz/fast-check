import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { failingProperty } from './__properties__/failing.cjs';
import { expectThrowWithCause } from './__test-helpers__/ThrowWithCause.js';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should not timeout but report failing predicates',
      async () => {
        // Arrange
        const expectedError = /I'm a failing property/;

        // Act / Assert
        await expectThrowWithCause(assert(failingProperty, defaultOptions), expectedError);
      },
      jestTimeout,
    );
  });
}
