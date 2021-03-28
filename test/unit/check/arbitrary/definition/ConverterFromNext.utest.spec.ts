import { convertFromNext } from '../../../../../src/check/arbitrary/definition/Converters';
import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../src/random/generator/Random';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { Stream } from '../../../../../src/fast-check-default';
import { ConverterFromNext } from '../../../../../src/check/arbitrary/definition/ConverterFromNext';
import * as stubRng from '../../../stubs/generators';

const mrngNoCall = stubRng.mutable.nocall();

describe('ConverterFromNext', () => {
  describe('isConverterFromNext', () => {
    it('should detect its own instances', () => {
      // Arrange
      class MyNextArbitrary extends NextArbitrary<number> {
        generate(_mrng: Random): NextValue<number> {
          throw new Error('Method not implemented.');
        }
        canGenerate(_value: unknown): _value is number {
          throw new Error('Method not implemented');
        }
        shrink(_value: number, _context?: unknown): Stream<NextValue<number>> {
          throw new Error('Method not implemented.');
        }
      }
      const originalInstance = new MyNextArbitrary();

      // Act
      const transformedInstance = convertFromNext(originalInstance);

      // Assert
      expect(ConverterFromNext.isConverterFromNext(transformedInstance)).toBe(true);
    });

    it('should not flag Arbitrary as one of its instances', () => {
      // Arrange
      class MyArbitrary extends Arbitrary<number> {
        generate(_mrng: Random): Shrinkable<number, number> {
          throw new Error('Method not implemented.');
        }
      }
      const originalInstance = new MyArbitrary();

      // Act / Assert
      expect(ConverterFromNext.isConverterFromNext(originalInstance)).toBe(false);
    });
  });

  describe('generate', () => {
    it('should be able to generate values using the underlying NextArbitrary', () => {
      // Arrange
      const expectedValue = 1;
      const generate = jest.fn().mockReturnValueOnce(new NextValue(expectedValue));
      const shrink = jest.fn();
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (_v: unknown): _v is number => {
          throw new Error('Unexpected call');
        };
        shrink = shrink;
      }
      const originalInstance = new MyNextArbitrary();

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const out = transformedInstance.generate(mrngNoCall);

      // Assert
      expect(out.value).toBe(expectedValue);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall);
      expect(shrink).not.toHaveBeenCalled();
    });

    it('should produce Shrinkable values calling shrink with the right context', () => {
      // Arrange
      const expectedFirstValue = 1;
      const expectedFirstContext = Symbol();
      const expectedShrunkValues = [2, 3, 4];
      const shrink = jest
        .fn<Stream<NextValue<number>>, any[]>()
        .mockReturnValueOnce(Stream.of(...expectedShrunkValues.map((v) => new NextValue(v))));
      const generate = jest.fn().mockReturnValueOnce(new NextValue(expectedFirstValue, expectedFirstContext));
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (_v: unknown): _v is number => {
          throw new Error('Unexpected call');
        };
        shrink = shrink;
      }
      const originalInstance = new MyNextArbitrary();

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const out = transformedInstance.generate(mrngNoCall);
      const outShrink = out.shrink();

      // Assert
      expect([...outShrink].map((v) => v.value)).toEqual(expectedShrunkValues);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(shrink).toHaveBeenCalledTimes(1);
      expect(shrink).toHaveBeenCalledWith(expectedFirstValue, expectedFirstContext);
    });

    it('should produce Shrinkable values calling shrink with the right context even deeper', () => {
      // Arrange
      const expectedShrunkValuesCall1 = [
        [2, Symbol()],
        [3, Symbol()],
        [4, Symbol()],
      ] as const;
      const expectedShrunkValuesCall2 = [
        [5, Symbol()],
        [6, Symbol()],
      ] as const;
      const shrink = jest
        .fn<Stream<NextValue<number>>, any[]>()
        .mockReturnValueOnce(Stream.of(...expectedShrunkValuesCall1.map((v) => new NextValue(v[0], v[1]))))
        .mockReturnValueOnce(Stream.of(...expectedShrunkValuesCall2.map((v) => new NextValue(v[0], v[1]))));
      const generate = jest.fn().mockReturnValueOnce(new NextValue(1, Symbol()));
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (_v: unknown): _v is number => {
          throw new Error('Unexpected call');
        };
        shrink = shrink;
      }
      const originalInstance = new MyNextArbitrary();

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const out = transformedInstance.generate(mrngNoCall);
      const outShrinkLvl1 = out.shrink();
      const outShrinkLvl2 = outShrinkLvl1.getNthOrLast(1)!.shrink();

      // Assert
      expect([...outShrinkLvl2].map((v) => v.value)).toEqual(expectedShrunkValuesCall2.map((v) => v[0]));
      expect(generate).toHaveBeenCalledTimes(1);
      expect(shrink).toHaveBeenCalledTimes(2);
      expect(shrink).toHaveBeenLastCalledWith(expectedShrunkValuesCall1[1][0], expectedShrunkValuesCall1[1][1]);
    });
  });
});
