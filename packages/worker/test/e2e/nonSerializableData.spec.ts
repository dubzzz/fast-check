import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

import {
  nonSerializableDataProperty,
  nonSerializableDataPropertyMainThread,
   
  // @ts-expect-error - Importing .mjs file without type definitions
} from './__properties__/nonSerializableData.mjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const testTimeout = 30000;
    const assertTimeout = 5000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout, includeErrorInReport: true };

    it(
      'should be able to deal with workers based on non-serializable data',
      async () => {
        // Arrange / Act / Assert
        await expect(assert(nonSerializableDataProperty, defaultOptions)).resolves.not.toThrow();
      },
      testTimeout,
    );

    it(
      'should refuse to execute on non-serializable data for main-thread',
      async () => {
        // Arrange / Act / Assert
        await expect(assert(nonSerializableDataPropertyMainThread, defaultOptions)).rejects.toThrow(/DataCloneError/);
      },
      testTimeout,
    );
  });
}
