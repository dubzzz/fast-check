import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

import {
  nonSerializableDataProperty,
  nonSerializableDataPropertyMainThread,
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
} from './__properties__/nonSerializableData.cjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout, includeErrorInReport: true };

    it(
      'should be able to deal with workers based on non-serializable data',
      async () => {
        // Arrange / Act / Assert
        await expect(assert(nonSerializableDataProperty, defaultOptions)).resolves.not.toThrow();
      },
      jestTimeout,
    );

    it(
      'should refuse to execute on non-serializable data for main-thread',
      async () => {
        // Arrange / Act / Assert
        await expect(assert(nonSerializableDataPropertyMainThread, defaultOptions)).rejects.toThrow(/DataCloneError/);
      },
      jestTimeout,
    );
  });
}
