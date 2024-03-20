import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { nonSerializableButSameDataProperty } from './__properties__/nonSerializableButSameData.cjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should produce the same data in worker and main thread',
      async () => {
        // Arrange
        let failed = false;

        // Act / Assert
        try {
          await assert(nonSerializableButSameDataProperty, defaultOptions);
        } catch (err) {
          failed = true;
          const message = String(err);
          expect(message).toContain('Shrunk 0 time(s)'); // no shrink when fallbacking to worker-based values
          const mainValueRegex = /Counterexample: \[(.*)\]/;
          const workerValueRegex = />>>nonSerializableButSameDataProperty=(.*)<<</;
          expect(message).toMatch(mainValueRegex);
          expect(message).toMatch(workerValueRegex);
          const mainValue = mainValueRegex.exec(message)![1];
          const workerValue = workerValueRegex.exec(message)![1];
          expect(workerValue).toBe(mainValue);
        }
        expect(failed).toBe(true);
      },
      jestTimeout,
    );
  });
}
