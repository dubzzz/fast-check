import { isMainThread } from 'node:worker_threads';
import fc, { type Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';

import {
  passingProperty,
  failingProperty,
  blockEventLoopProperty,
  buildUnregisteredProperty,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from './main.properties.cjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should not timeout when predicate iterates up to the end really quickly',
      async () => {
        // Arrange / Act / Assert
        await expect(assert(passingProperty, defaultOptions)).resolves.not.toThrow();
      },
      jestTimeout
    );

    it(
      'should not timeout but report failing predicates',
      async () => {
        // Arrange
        const expectedError = /I'm a failing property/;

        // Act / Assert
        await expect(assert(failingProperty, defaultOptions)).rejects.toThrowError(expectedError);
      },
      jestTimeout
    );

    it(
      'should timeout when predicate fully blocks the event loop',
      async () => {
        // Arrange
        const options = { ...defaultOptions, endOnFailure: true };
        const expectedError = /Property timeout: exceeded limit of 1000 milliseconds/;

        // Act / Assert
        await expect(assert(blockEventLoopProperty, options)).rejects.toThrowError(expectedError);
      },
      jestTimeout
    );

    it(
      'should fail to start when property has not been registered',
      async () => {
        // Arrange
        const unregisteredProperty = buildUnregisteredProperty();
        const expectedError = /Worker stopped with exit code 0/;

        // Act / Assert
        await expect(assert(unregisteredProperty, defaultOptions)).rejects.toThrowError(expectedError);
      },
      jestTimeout
    );

    it.each`
      type               | sync
      ${'property'}      | ${true}
      ${'asyncProperty'} | ${false}
    `(
      'should be able to run any basic successful $type',
      async ({ sync }) => {
        // Arrange
        const property = sync ? fc.property(fc.nat(), () => true) : fc.asyncProperty(fc.nat(), async () => true);

        // Act / Assert
        await expect(assert(property, defaultOptions)).resolves.not.toThrow();
      },
      jestTimeout
    );

    it.each`
      type               | sync
      ${'property'}      | ${true}
      ${'asyncProperty'} | ${false}
    `(
      'should be able to run any basic failing $type',
      async ({ sync }) => {
        // Arrange
        const property = sync ? fc.property(fc.nat(), () => false) : fc.asyncProperty(fc.nat(), async () => false);
        const expectedError = /Property failed by returning false/;

        // Act / Assert
        await expect(assert(property, defaultOptions)).rejects.toThrowError(expectedError);
      },
      jestTimeout
    );
  });
}
