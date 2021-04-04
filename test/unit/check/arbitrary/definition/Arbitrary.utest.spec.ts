import { Arbitrary, assertIsArbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';

import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { ArbitraryWithShrink } from '../../../../../src/check/arbitrary/definition/ArbitraryWithShrink';
import { Stream } from '../../../../../src/stream/Stream';

describe('Arbitrary', () => {
  describe('assertIsArbitrary', () => {
    it('should reject explicitely invalid instances (with missing generate)', () => {
      // Arrange
      const fakeArbitrary = {} as Arbitrary<any>;

      // Act / Assert
      expect(() => assertIsArbitrary(fakeArbitrary)).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected value received: not an instance of Arbitrary"`
      );
    });

    it('should accept instances extending Arbitrary', () => {
      // Arrange
      class MyOldArbitrary extends Arbitrary<any> {
        generate(): Shrinkable<any> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary: Arbitrary<any> = new MyOldArbitrary();

      // Act / Assert
      expect(() => assertIsArbitrary(fakeArbitrary)).not.toThrowError();
    });

    it('should accept instances extending ArbitraryWithShrink', () => {
      // Arrange
      class MyOldArbitraryWithShrink extends ArbitraryWithShrink<any> {
        generate(): Shrinkable<any> {
          throw new Error('Not implemented.');
        }
        shrink(): Stream<any> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary: Arbitrary<any> = new MyOldArbitraryWithShrink();

      // Act / Assert
      expect(() => assertIsArbitrary(fakeArbitrary)).not.toThrowError();
    });

    it('should accept instances with the very same API', () => {
      // Arrange
      const fakeArbitrary: Arbitrary<any> = {
        generate() {
          throw new Error('Not implemented');
        },
        filter() {
          throw new Error('Not implemented');
        },
        map() {
          throw new Error('Not implemented');
        },
        chain() {
          throw new Error('Not implemented');
        },
        withBias() {
          throw new Error('Not implemented');
        },
        noBias() {
          throw new Error('Not implemented');
        },
        noShrink() {
          throw new Error('Not implemented');
        },
      };

      // Act / Assert
      expect(() => assertIsArbitrary(fakeArbitrary)).not.toThrowError();
    });
  });
});
