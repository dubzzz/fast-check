import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { blockEventLoopProperty } from './__properties__/blockEventLoop.cjs';
import { expectThrowWithCause } from './__test-helpers__/ThrowWithCause.js';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should timeout when predicate fully blocks the event loop',
      async () => {
        // Arrange
        const options: Parameters<unknown> = { ...defaultOptions, endOnFailure: true };
        const expectedError = /Property timeout: exceeded limit of 1000 milliseconds/;

        // Act / Assert
        await expectThrowWithCause(assert(blockEventLoopProperty, options), expectedError);
      },
      jestTimeout,
    );
  });
}
