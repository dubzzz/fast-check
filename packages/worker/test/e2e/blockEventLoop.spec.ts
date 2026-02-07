import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it } from 'vitest';

// @ts-expect-error - Importing .mjs file without type definitions
import { blockEventLoopProperty } from './__properties__/blockEventLoop.mjs';
import { expectThrowWithCause } from './__test-helpers__/ThrowWithCause.js';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const testTimeout = 30000;
    const assertTimeout = 5000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should timeout when predicate fully blocks the event loop',
      async () => {
        // Arrange
        const options: Parameters<unknown> = { ...defaultOptions, endOnFailure: true };
        const expectedError = /Property timeout: exceeded limit of 5000 milliseconds/;

        // Act / Assert
        await expectThrowWithCause(assert(blockEventLoopProperty, options), expectedError);
      },
      testTimeout,
    );
  });
}
