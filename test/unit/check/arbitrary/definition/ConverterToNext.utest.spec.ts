import { convertToNext } from '../../../../../src/check/arbitrary/definition/Converters';
import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../src/random/generator/Random';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { ConverterToNext } from '../../../../../src/check/arbitrary/definition/ConverterToNext';
import { Stream } from '../../../../../src/stream/Stream';
import { ConverterFromNext } from '../../../../../src/check/arbitrary/definition/ConverterFromNext';
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
        canShrinkWithoutContext(_value: unknown): _value is number {
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
      const withBias = jest.fn();
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
        withBias = withBias;
      }
      const originalInstance = new MyArbitrary();

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const out = transformedInstance.generate(mrngNoCall, undefined);

      // Assert
      expect(out.value).toBe(expectedValue);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall);
      expect(withBias).not.toHaveBeenCalled();
    });

    it('should be able to generate biased values using the underlying Arbitrary', () => {
      // Arrange
      const expectedBiasedFactor = 42;
      const expectedValue = 1;
      const generate = jest.fn().mockReturnValueOnce(new Shrinkable(expectedValue));
      const withBias = jest.fn();
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
        withBias = withBias;
      }
      const originalInstance = new MyArbitrary();
      withBias.mockReturnValue(originalInstance);

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const out = transformedInstance.generate(mrngNoCall, expectedBiasedFactor);

      // Assert
      expect(out.value).toBe(expectedValue);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall);
      expect(withBias).toHaveBeenCalledTimes(1);
      expect(withBias).toHaveBeenCalledWith(expectedBiasedFactor);
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
      const out = transformedInstance.generate(mrngNoCall, undefined);
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
      const out = transformedInstance.generate(mrngNoCall, undefined);
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

  describe('filter', () => {
    it('should call filter directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const filter = jest.fn();
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
        filter = filter;
      }
      const originalInstance = new MyArbitrary();
      const filteredInstance = new MyArbitrary();
      filter.mockReturnValue(filteredInstance);
      const predicate = () => true;

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const transformedInstanceFiltered = transformedInstance.filter(predicate);

      // Assert
      expect(filter).toHaveBeenCalledTimes(1);
      expect(filter).toHaveBeenCalledWith(predicate);
      expect(ConverterToNext.isConverterToNext(transformedInstanceFiltered)).toBe(true);
      expect((transformedInstanceFiltered as ConverterToNext<number>).arb).toBe(filteredInstance);
    });

    it('should unwrap instances of ConverterFromNext returned by filter', () => {
      // Arrange
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn();
      const shrink = jest.fn();
      const filter = jest.fn();
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
        filter = filter;
      }
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext as any as (v: unknown) => v is number;
        shrink = shrink;
      }
      const originalInstance = new MyArbitrary();
      const filteredInstanceNext = new MyNextArbitrary();
      filter.mockReturnValue(new ConverterFromNext(filteredInstanceNext));
      const predicate = () => true;

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const transformedInstanceFiltered = transformedInstance.filter(predicate);

      // Assert
      expect(ConverterToNext.isConverterToNext(transformedInstanceFiltered)).toBe(false);
      expect(transformedInstanceFiltered).toBe(filteredInstanceNext);
    });
  });

  describe('map', () => {
    it('should call map directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const map = jest.fn();
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
        map = map;
      }
      const originalInstance = new MyArbitrary();
      const mappedInstance = new MyArbitrary();
      map.mockReturnValue(mappedInstance);
      const mapper = () => 0;

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const transformedInstanceMapped = transformedInstance.map(mapper);

      // Assert
      expect(map).toHaveBeenCalledTimes(1);
      expect(map).toHaveBeenCalledWith(mapper);
      expect(ConverterToNext.isConverterToNext(transformedInstanceMapped)).toBe(true);
      expect((transformedInstanceMapped as ConverterToNext<number>).arb).toBe(mappedInstance);
    });

    it('should unwrap instances of ConverterFromNext returned by map', () => {
      // Arrange
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn();
      const shrink = jest.fn();
      const map = jest.fn();
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
        map = map;
      }
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext as any as (v: unknown) => v is number;
        shrink = shrink;
        map = map;
      }
      const originalInstance = new MyArbitrary();
      const mappedInstanceNext = new MyNextArbitrary();
      map.mockReturnValue(new ConverterFromNext(mappedInstanceNext));
      const mapper = () => 0;

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const transformedInstanceMapped = transformedInstance.map(mapper);

      // Assert
      expect(ConverterToNext.isConverterToNext(transformedInstanceMapped)).toBe(false);
      expect(transformedInstanceMapped).toBe(mappedInstanceNext);
    });
  });

  describe('chain', () => {
    it('should call map directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const chain = jest.fn();
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
        chain = chain;
      }
      const originalInstance = new MyArbitrary();
      const chainedInstance = new MyArbitrary();
      const outChainedInstance = new MyArbitrary();
      const outChainedInstanceNext = new ConverterToNext(outChainedInstance);
      chain.mockReturnValue(chainedInstance);
      const chainer = () => outChainedInstanceNext;

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const transformedInstanceMapped = transformedInstance.chain(chainer);

      // Assert
      expect(chain).toHaveBeenCalledTimes(1);
      expect(ConverterToNext.isConverterToNext(transformedInstanceMapped)).toBe(true);
      expect((transformedInstanceMapped as ConverterToNext<number>).arb).toBe(chainedInstance);
    });
  });

  describe('noShrink', () => {
    it('should call noShrink directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const noShrink = jest.fn();
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
        noShrink = noShrink;
      }
      const originalInstance = new MyArbitrary();
      const noShrinkInstance = new MyArbitrary();
      noShrink.mockReturnValue(noShrinkInstance);

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const transformedInstanceNoShrink = transformedInstance.noShrink();

      // Assert
      expect(noShrink).toHaveBeenCalledTimes(1);
      expect(ConverterToNext.isConverterToNext(transformedInstanceNoShrink)).toBe(true);
      expect((transformedInstanceNoShrink as ConverterToNext<number>).arb).toBe(noShrinkInstance);
    });
  });

  describe('noBias', () => {
    it('should call noBias directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const noBias = jest.fn();
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
        noBias = noBias;
      }
      const originalInstance = new MyArbitrary();
      const noBiasInstance = new MyArbitrary();
      noBias.mockReturnValue(noBiasInstance);

      // Act
      const transformedInstance = new ConverterToNext(originalInstance);
      const transformedInstanceNoBias = transformedInstance.noBias();

      // Assert
      expect(noBias).toHaveBeenCalledTimes(1);
      expect(ConverterToNext.isConverterToNext(transformedInstanceNoBias)).toBe(true);
      expect((transformedInstanceNoBias as ConverterToNext<number>).arb).toBe(noBiasInstance);
    });
  });
});
