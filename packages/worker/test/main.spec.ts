import { isMainThread } from 'node:worker_threads';
import fc from 'fast-check';
import { clearAllWorkersFor } from '@fast-check/worker';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { passingProperty, failingProperty, blockEventLoopProperty } from './main.properties.cjs';

if (isMainThread) {
  describe('workerProperty', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const assertOptions: fc.Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should not timeout when predicate iterates up to the end really quickly',
      async () => {
        // Arrange / Act / Assert
        try {
          await expect(fc.assert(passingProperty, assertOptions)).resolves.not.toThrow();
        } finally {
          clearAllWorkersFor(passingProperty);
        }
      },
      jestTimeout
    );

    it(
      'should not timeout but report failing predicates',
      async () => {
        // Arrange / Act / Assert
        try {
          await expect(fc.assert(failingProperty, assertOptions)).rejects.toThrowError(/I'm a failing property/);
        } finally {
          clearAllWorkersFor(failingProperty);
        }
      },
      jestTimeout
    );

    it(
      'should timeout when predicate fully blocks the event loop',
      async () => {
        // Arrange / Act / Assert
        try {
          await expect(
            fc.assert(blockEventLoopProperty, { ...assertOptions, numRuns: 5, endOnFailure: true })
          ).rejects.toThrowError(/Property timeout: exceeded limit of 1000 milliseconds/);
        } finally {
          clearAllWorkersFor(blockEventLoopProperty);
        }
      },
      jestTimeout
    );
  });
}
