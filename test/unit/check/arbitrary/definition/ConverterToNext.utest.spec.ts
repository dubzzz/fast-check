import { convertToNext } from '../../../../../src/check/arbitrary/definition/Converters';
import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../src/random/generator/Random';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { ConverterToNext } from '../../../../../src/check/arbitrary/definition/ConverterToNext';
import { Stream } from '../../../../../src/stream/Stream';
import * as stubRng from '../../../stubs/generators';

const mrngNoCall = stubRng.mutable.nocall();

describe('ConverterToNext', () => {
  describe('isConverterToNext', () => {
    it('should detect its own instances', () => {
      // Arrange
      class MyArbitrary extends Arbitrary<number> {
        generate(_mrng: Random): Shrinkable<number, number> {
          throw new Error('Method not implemented.');
        }
      }
      const originalInstance = new MyArbitrary();

      // Act
      const transformedInstance = convertToNext(originalInstance);

      // Assert
      expect(ConverterToNext.isConverterToNext(transformedInstance)).toBe(true);
    });

    it('should not flag NextArbitrary as one of its instances', () => {
      // Arrange
      class MyNextArbitrary extends NextArbitrary<number> {
        generate(_mrng: Random): NextValue<number> {
          throw new Error('Method not implemented.');
        }
        canGenerate(_value: unknown): _value is number {
          throw new Error('Method not implemented.');
        }
        shrink(_value: number, _context?: unknown): Stream<NextValue<number>> {
          throw new Error('Method not implemented.');
        }
      }
      const originalInstance = new MyNextArbitrary();

      // Act / Assert
      expect(ConverterToNext.isConverterToNext(originalInstance)).toBe(false);
    });
  });

  describe('generate', () => {
    it('should be able to generate values using the underlying Arbitrary', () => {
      // Arrange
      const expectedValue = 1;
      const generate = jest.fn().mockReturnValueOnce(new Shrinkable(expectedValue));
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
      }
      const originalInstance = new MyArbitrary();

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const out = transformedInstance.generate(mrngNoCall);

      // Assert
      expect(out.value).toBe(expectedValue);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall);
    });
  });

  describe('shrink', () => {
    it('should be able to shrink values using the returned Shrinkable', () => {
      // Arrange
      const expectedShrunkValues = [2, 3, 4];
      const shrink = jest
        .fn<Stream<Shrinkable<number, number>>, any[]>()
        .mockReturnValueOnce(Stream.of(...expectedShrunkValues.map((v) => new Shrinkable(v))));
      const generate = jest.fn().mockReturnValueOnce(new Shrinkable(1, shrink));
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
      }
      const originalInstance = new MyArbitrary();

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const out = transformedInstance.generate(mrngNoCall);
      const outShrink = transformedInstance.shrink(out.value, out.context);

      // Assert
      expect([...outShrink].map((v) => v.value)).toEqual(expectedShrunkValues);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(shrink).toHaveBeenCalledTimes(1);
    });

    it('should be able to shrink values using the returned Shrinkable even deeper', () => {
      // Arrange
      const expectedShrunkValues = [5, 6];
      const shrinkLvl2 = jest
        .fn<Stream<Shrinkable<number, number>>, any[]>()
        .mockReturnValueOnce(Stream.of(...expectedShrunkValues.map((v) => new Shrinkable(v))));
      const shrinkLvl1 = jest
        .fn<Stream<Shrinkable<number, number>>, any[]>()
        .mockReturnValueOnce(Stream.of(...[2, 3, 4].map((v) => new Shrinkable(v, shrinkLvl2))));
      const generate = jest.fn().mockReturnValueOnce(new Shrinkable(1, shrinkLvl1));
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
      }
      const originalInstance = new MyArbitrary();

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const out = transformedInstance.generate(mrngNoCall);
      const outShrinkLvl1 = transformedInstance.shrink(out.value, out.context);
      const firstShrunkValue = outShrinkLvl1.getNthOrLast(0)!;
      const outShrinkLvl2 = transformedInstance.shrink(firstShrunkValue.value, firstShrunkValue.context);

      // Assert
      expect([...outShrinkLvl2].map((v) => v.value)).toEqual(expectedShrunkValues);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(shrinkLvl1).toHaveBeenCalledTimes(1);
      expect(shrinkLvl2).toHaveBeenCalledTimes(1);
    });
  });
});
