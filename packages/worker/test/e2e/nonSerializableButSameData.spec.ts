import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { check, stringify } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

import {
  nonSerializableButSameDataProperty,
  nonSerializableButSameDataRawProperty,
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
} from './__properties__/nonSerializableButSameData.cjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout, includeErrorInReport: true };

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

    it(
      'should produce the same data in worker and on separate on the side sample',
      async () => {
        // Arrange
        let failed = false;

        // Act / Assert
        try {
          await assert(nonSerializableButSameDataProperty, defaultOptions);
        } catch (err) {
          failed = true;
          const message = String(err);
          const seedRegex = /seed: (-?\d+),/;
          const pathRegex = /path: "(\d+)",/;
          const workerValueRegex = />>>nonSerializableButSameDataProperty=(.*)<<</;
          expect(message).toMatch(seedRegex);
          expect(message).toMatch(pathRegex);
          expect(message).toMatch(workerValueRegex);
          const seed = seedRegex.exec(message)![1];
          const path = pathRegex.exec(message)![1];
          const workerValue = workerValueRegex.exec(message)![1];
          const out = await check(nonSerializableButSameDataRawProperty, {
            ...defaultOptions,
            seed: +seed,
            path,
            numRuns: 1,
            endOnFailure: true,
          });
          const sampledValue = (out.counterexample as [symbol])[0];
          const extraDetails = { seed, path };
          expect({ ...extraDetails, value: stringify(sampledValue) }).toEqual({ ...extraDetails, value: workerValue });
        }
        expect(failed).toBe(true);
      },
      jestTimeout,
    );
  });
}
