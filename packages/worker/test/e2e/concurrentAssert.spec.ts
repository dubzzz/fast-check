import { isMainThread } from 'node:worker_threads';
import { readFileSync, rmSync } from 'node:fs';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { readerAssert, writerAssert, concurrentLogFile } from './__properties__/concurrentAssert.mjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const testTimeout = 30000;
    const assertTimeout = 5000;
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
        try {
          await expect(Promise.all([readerRun, writerRun])).resolves.not.toThrow();
        } catch (err) {
          throw new Error(
            'Failed to run concurrentAssert, with log file:\n\n' + readFileSync(concurrentLogFile).toString(),
            // @ts-expect-error - Not yet supported by our TS target
            { cause: err },
          );
        } finally {
          rmSync(concurrentLogFile, { force: true });
        }
      },
      testTimeout,
    );
  });
}
