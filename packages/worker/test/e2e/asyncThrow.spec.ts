import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { asyncThrowProperty } from './__properties__/asyncThrow.cjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should intercept asynchronous throw if any',
      async () => {
        // Arrange
        let failed = false;

        // Act / Assert
        try {
          await assert(asyncThrowProperty, defaultOptions);
        } catch (err) {
          failed = true;
          const rootMessage = String(err);
          const mainValueRegex = /Counterexample: \[(-?\d+),(-?\d+)\]/;
          expect(rootMessage).toMatch(mainValueRegex);
          const fromValue = +mainValueRegex.exec(rootMessage)![1];
          const toValue = +mainValueRegex.exec(rootMessage)![2];
          expect(Math.abs(fromValue - toValue)).toBeGreaterThanOrEqual(100);
          expect(err).toHaveProperty('cause');
          const nestedMessage = String((err as any).cause);
          expect(nestedMessage).toContain('Out of range, asynchronously');
        }
        expect(failed).toBe(true);
      },
      jestTimeout,
    );
  });
}
