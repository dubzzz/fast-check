import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { passingProperty } from './__properties__/passing.mjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const testTimeout = 30000;
    const assertTimeout = 5000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should not timeout when predicate iterates up to the end really quickly',
      async () => {
        // Arrange / Act / Assert
        await expect(assert(passingProperty, defaultOptions)).resolves.not.toThrow();
      },
      testTimeout,
    );
  });
}
