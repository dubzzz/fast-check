import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { supportPreProperty } from './__properties__/supportPre.cjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout, seed: -340565462 };

    it(
      'should support pre',
      async () => {
        // Arrange / Act / Assert
        await expect(assert(supportPreProperty, defaultOptions)).resolves.not.toThrow();
      },
      jestTimeout,
    );
  });
}
