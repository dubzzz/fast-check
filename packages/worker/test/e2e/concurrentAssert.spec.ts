import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

import { readerAssert, writerAssert } from './__properties__/concurrentAssert.mjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should be able to run two inter-dependent asserts',
      async () => {
        // While this pattern is definitely not recommended, we leverage it in our test suite to make sure
        // two concurrent workers can be spawn at the same time on the default isolation level (file)
        // Arrange
        const options: Parameters<unknown> = { ...defaultOptions, numRuns: 5 };

        // Act
        const readerRun = assert(readerAssert, options); // reader asks questions to writer and waits for the answer
        const writerRun = assert(writerAssert, options); // writer waits for questions from reader and sends an answer

        // Assert
        await expect(Promise.all([readerRun, writerRun])).resolves.not.toThrow();
      },
      jestTimeout,
    );
  });
}
