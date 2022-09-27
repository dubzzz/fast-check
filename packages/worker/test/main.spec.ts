import { isMainThread } from 'node:worker_threads';
import fc from 'fast-check';
import { clearAllWorkersFor } from '@fast-check/worker';

import {
  passingProperty,
  failingProperty,
  blockEventLoopProperty,
  buildUnregisteredProperty,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './main.properties.cjs';

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
            fc.assert(blockEventLoopProperty, { ...assertOptions, endOnFailure: true })
          ).rejects.toThrowError(/Property timeout: exceeded limit of 1000 milliseconds/);
        } finally {
          clearAllWorkersFor(blockEventLoopProperty);
        }
      },
      jestTimeout
    );

    it(
      'should fail to start when property has not been registered',
      async () => {
        // Arrange / Act / Assert
        const unregisteredProperty = buildUnregisteredProperty();
        try {
          await expect(fc.assert(unregisteredProperty, assertOptions)).rejects.toThrowError(
            /Worker stopped with exit code 0/
          );
        } finally {
          clearAllWorkersFor(unregisteredProperty);
        }
      },
      jestTimeout
    );
  });
}
