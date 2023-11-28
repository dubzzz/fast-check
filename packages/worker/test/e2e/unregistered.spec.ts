import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { buildUnregisteredProperty } from './__properties__/unregistered.cjs';
import { expectThrowWithCause } from './__test-helpers__/ThrowWithCause.js';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should fail to start when property has not been registered',
      async () => {
        // Arrange
        const unregisteredProperty = buildUnregisteredProperty();
        const expectedError = /Unregistered predicate/;

        // Act / Assert
        await expectThrowWithCause(assert(unregisteredProperty, defaultOptions), expectedError);
      },
      jestTimeout,
    );
  });
}
