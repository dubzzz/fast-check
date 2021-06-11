import {
  convertFromNext,
  convertFromNextWithShrunkOnce,
  convertToNext,
} from '../../../../../src/check/arbitrary/definition/Converters';
import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../src/random/generator/Random';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { ArbitraryWithContextualShrink } from '../../../../../src/check/arbitrary/definition/ArbitraryWithContextualShrink';
import { Stream } from '../../../../../src/stream/Stream';

describe('Converters', () => {
  it('should return the original instance of Arbitrary when calling convertFromNext(convertToNext)', () => {
    // Arrange
    class MyArbitrary extends Arbitrary<number> {
      generate(_mrng: Random): Shrinkable<number, number> {
        throw new Error('Method not implemented.');
      }
    }
    const originalInstance = new MyArbitrary();

    // Act
    const transformedInstance = convertFromNext(convertToNext(originalInstance));

    // Assert
    expect(transformedInstance).toBe(originalInstance);
  });

  it('should return the original instance of NextArbitrary when calling convertToNext(convertFromNext)', () => {
    // Arrange
    class MyNextArbitrary extends NextArbitrary<number> {
      generate(_mrng: Random): NextValue<number> {
        throw new Error('Method not implemented.');
      }
      canShrinkWithoutContext(_value: unknown): _value is number {
        throw new Error('Method not implemented.');
      }
      shrink(_value: number, _context?: unknown): Stream<NextValue<number>> {
        throw new Error('Method not implemented.');
      }
    }
    const originalInstance = new MyNextArbitrary();

    // Act
    const transformedInstance = convertToNext(convertFromNext(originalInstance));

    // Assert
    expect(transformedInstance).toBe(originalInstance);
  });

  it('should return the original instance of ArbitraryWithContextualShrink when calling convertFromNextWithShrunkOnce(convertToNext)', () => {
    // Arrange
    class MyArbitraryWithContextualShrink extends ArbitraryWithContextualShrink<number> {
      generate(_mrng: Random): Shrinkable<number, number> {
        throw new Error('Method not implemented.');
      }
      contextualShrink(): Stream<[number, unknown]> {
        throw new Error('Method not implemented.');
      }
      shrunkOnceContext(): unknown {
        return 0;
      }
    }
    const originalInstance = new MyArbitraryWithContextualShrink();

    // Act
    const transformedInstance = convertFromNextWithShrunkOnce(
      convertToNext(originalInstance),
      originalInstance.shrunkOnceContext()
    );

    // Assert
    expect(transformedInstance).toBe(originalInstance);
  });

  it('should reject conversion convertFromNextWithShrunkOnce(convertToNext) if original instance was not ArbitraryWithContextualShrink', () => {
    // Arrange
    class MyArbitrary extends Arbitrary<number> {
      generate(_mrng: Random): Shrinkable<number, number> {
        throw new Error('Method not implemented.');
      }
    }
    const originalInstance = new MyArbitrary();

    // Act / Assert
    expect(() => convertFromNextWithShrunkOnce(convertToNext(originalInstance), 0)).toThrowErrorMatchingInlineSnapshot(
      `"Conversion rejected: Underlying arbitrary is not compatible with ArbitraryWithContextualShrink"`
    );
  });
});
