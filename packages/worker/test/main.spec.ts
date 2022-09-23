import { isMainThread } from 'node:worker_threads';
import fc from 'fast-check';
import { clearAllWorkersFor } from '@fast-check/worker';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { passingProperty, failingProperty, blockEventLoopProperty } from './main.properties.cjs';

if (isMainThread) {
  describe('workerProperty', () => {
    const assertOptions: fc.Parameters<unknown> = { timeout: 1000, numRuns: 5, endOnFailure: true };

    it('should not timeout when predicate iterate up to the end really quickly', async () => {
      // Arrange / Act / Assert
      try {
        await expect(fc.assert(passingProperty, assertOptions)).resolves.not.toThrow();
      } finally {
        clearAllWorkersFor(passingProperty);
      }
    }, 10000);

    it('should not timeout but report failing predicates', async () => {
      // Arrange / Act / Assert
      try {
        await expect(fc.assert(failingProperty, assertOptions)).rejects.toThrowError(/I'm a failing property/);
      } finally {
        clearAllWorkersFor(failingProperty);
      }
    }, 10000);

    it('should timeout when predicate fully block the event loop', async () => {
      // Arrange / Act / Assert
      try {
        await expect(fc.assert(blockEventLoopProperty, assertOptions)).rejects.toThrowError(
          /Property timeout: exceeded limit of 1000 milliseconds/
        );
      } finally {
        clearAllWorkersFor(blockEventLoopProperty);
      }
    }, 10000);
  });
}
