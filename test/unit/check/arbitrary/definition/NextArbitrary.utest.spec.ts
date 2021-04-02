import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { NextArbitrary, assertIsNextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';

import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { ArbitraryWithShrink } from '../../../../../src/check/arbitrary/definition/ArbitraryWithShrink';
import { Stream } from '../../../../../src/stream/Stream';
import * as stubRng from '../../../stubs/generators';

const mrngNoCall = stubRng.mutable.nocall();

describe('NextArbitrary', () => {
  describe('assertIsNextArbitrary', () => {
    it('should reject explicitely invalid instances (with missing generate)', () => {
      // Arrange
      const fakeArbitrary = {} as NextArbitrary<any>;

      // Act / Assert
      expect(() => assertIsNextArbitrary(fakeArbitrary)).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected value received: not an instance of NextArbitrary"`
      );
    });

    it('should reject basic instances of Arbitrary (legacy)', () => {
      // Arrange
      class MyOldArbitrary extends Arbitrary<any> {
        generate(): Shrinkable<any> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary = (new MyOldArbitrary() as unknown) as NextArbitrary<any>;

      // Act / Assert
      expect(() => assertIsNextArbitrary(fakeArbitrary)).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected value received: not an instance of NextArbitrary"`
      );
    });

    it('should reject basic instances of ArbitraryWithShrink (legacy)', () => {
      // Arrange
      class MyOldArbitraryWithShrink extends ArbitraryWithShrink<any> {
        generate(): Shrinkable<any> {
          throw new Error('Not implemented.');
        }
        shrink(): Stream<any> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary = (new MyOldArbitraryWithShrink() as unknown) as NextArbitrary<any>;

      // Act / Assert
      expect(() => assertIsNextArbitrary(fakeArbitrary)).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected value received: not an instance of NextArbitrary"`
      );
    });

    it('should accept instances extending NextArbitrary', () => {
      // Arrange
      class MyNextArbitrary extends NextArbitrary<any> {
        generate(): NextValue<any> {
          throw new Error('Not implemented.');
        }
        canGenerate(value: unknown): value is any {
          throw new Error('Not implemented.');
        }
        shrink(): Stream<NextValue<any>> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary: NextArbitrary<any> = new MyNextArbitrary();

      // Act / Assert
      expect(() => assertIsNextArbitrary(fakeArbitrary)).not.toThrowError();
    });

    it('should accept instances with the very same API', () => {
      // Arrange
      const fakeArbitrary: NextArbitrary<any> = {
        generate() {
          throw new Error('Not implemented');
        },
        canGenerate(v): v is any {
          throw new Error('Not implemented');
        },
        shrink() {
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
        noBias() {
          throw new Error('Not implemented');
        },
        noShrink() {
          throw new Error('Not implemented');
        },
      };

      // Act / Assert
      expect(() => assertIsNextArbitrary(fakeArbitrary)).not.toThrowError();
    });
  });

  describe('noShrink', () => {
    it('should override default shrink with function returning an empty Stream', () => {
      // Arrange
      const shrink = jest.fn();
      class MyNextArbitrary extends NextArbitrary<any> {
        generate(): NextValue<any> {
          throw new Error('Not implemented.');
        }
        canGenerate(value: unknown): value is any {
          throw new Error('Not implemented.');
        }
        shrink = shrink;
      }
      const fakeArbitrary: NextArbitrary<any> = new MyNextArbitrary();
      const noShrinkArbitrary = fakeArbitrary.noShrink();

      // Act
      const out = noShrinkArbitrary.shrink(5, Symbol());

      // Assert
      expect([...out]).toHaveLength(0);
      expect(shrink).not.toHaveBeenCalled();
    });

    it('should return itself when called twice', () => {
      // Arrange
      class MyNextArbitrary extends NextArbitrary<any> {
        generate(): NextValue<any> {
          throw new Error('Not implemented.');
        }
        canGenerate(value: unknown): value is any {
          throw new Error('Not implemented.');
        }
        shrink(): Stream<NextValue<any>> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary: NextArbitrary<any> = new MyNextArbitrary();

      // Act
      const firstNoShrink = fakeArbitrary.noShrink();
      const secondNoShrink = firstNoShrink.noShrink();

      // Assert
      expect(secondNoShrink).toBe(firstNoShrink);
    });
  });

  describe('noBias', () => {
    it('should override passed bias with undefined', () => {
      // Arrange
      const generate = jest.fn();
      class MyNextArbitrary extends NextArbitrary<any> {
        generate = generate;
        canGenerate(value: unknown): value is any {
          throw new Error('Not implemented.');
        }
        shrink(): Stream<NextValue<any>> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary: NextArbitrary<any> = new MyNextArbitrary();
      const noBiasArbitrary = fakeArbitrary.noBias();

      // Act
      noBiasArbitrary.generate(mrngNoCall, 42);

      // Assert
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall, undefined);
    });

    it('should return itself when called twice', () => {
      // Arrange
      class MyNextArbitrary extends NextArbitrary<any> {
        generate(): NextValue<any> {
          throw new Error('Not implemented.');
        }
        canGenerate(value: unknown): value is any {
          throw new Error('Not implemented.');
        }
        shrink(): Stream<NextValue<any>> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary: NextArbitrary<any> = new MyNextArbitrary();

      // Act
      const firstNoBias = fakeArbitrary.noBias();
      const secondNoBias = firstNoBias.noBias();

      // Assert
      expect(secondNoBias).toBe(firstNoBias);
    });
  });
});
