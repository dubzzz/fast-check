import { convertFromNext } from '../../../../../src/check/arbitrary/definition/Converters';
import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../src/random/generator/Random';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { ConverterFromNext } from '../../../../../src/check/arbitrary/definition/ConverterFromNext';
import { Stream } from '../../../../../src/stream/Stream';
import * as stubRng from '../../../stubs/generators';
import { ConverterToNext } from '../../../../../src/check/arbitrary/definition/ConverterToNext';

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
      expect(generate).toHaveBeenCalledWith(mrngNoCall, undefined);
      expect(shrink).not.toHaveBeenCalled();
    });

    it('should be able to generate biased values using the underlying NextArbitrary', () => {
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
      const biasedFactor = 42;
      const originalInstance = new MyNextArbitrary();

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const out = transformedInstance.withBias(biasedFactor).generate(mrngNoCall);

      // Assert
      expect(out.value).toBe(expectedValue);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall, biasedFactor);
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

  describe('filter', () => {
    it('should call filter directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const canGenerate = jest.fn();
      const shrink = jest.fn();
      const filter = jest.fn();
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (canGenerate as any) as (v: unknown) => v is number;
        shrink = shrink;
        filter = filter;
      }
      const originalInstance = new MyNextArbitrary();
      const filteredInstance = new MyNextArbitrary();
      filter.mockReturnValue(filteredInstance);
      const predicate = () => true;

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const transformedInstanceFiltered = transformedInstance.filter(predicate);

      // Assert
      expect(filter).toHaveBeenCalledTimes(1);
      expect(filter).toHaveBeenCalledWith(predicate);
      expect(ConverterFromNext.isConverterFromNext(transformedInstanceFiltered)).toBe(true);
      expect((transformedInstanceFiltered as ConverterFromNext<number>).arb).toBe(filteredInstance);
    });

    it('should unwrap instances of ConverterFromNext returned by filter', () => {
      // Arrange
      const generate = jest.fn();
      const canGenerate = jest.fn();
      const shrink = jest.fn();
      const filter = jest.fn();
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (canGenerate as any) as (v: unknown) => v is number;
        shrink = shrink;
        filter = filter;
      }
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
      }
      const originalInstance = new MyNextArbitrary();
      const filteredInstanceOld = new MyArbitrary();
      filter.mockReturnValue(new ConverterToNext(filteredInstanceOld));
      const predicate = () => true;

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const transformedInstanceFiltered = transformedInstance.filter(predicate);

      // Assert
      expect(ConverterFromNext.isConverterFromNext(transformedInstanceFiltered)).toBe(false);
      expect(transformedInstanceFiltered).toBe(filteredInstanceOld);
    });
  });

  describe('map', () => {
    it('should call map directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const canGenerate = jest.fn();
      const shrink = jest.fn();
      const map = jest.fn();
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (canGenerate as any) as (v: unknown) => v is number;
        shrink = shrink;
        map = map;
      }
      const originalInstance = new MyNextArbitrary();
      const filteredInstance = new MyNextArbitrary();
      map.mockReturnValue(filteredInstance);
      const mapper = () => 0;

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const transformedInstanceFiltered = transformedInstance.map(mapper);

      // Assert
      expect(map).toHaveBeenCalledTimes(1);
      expect(map).toHaveBeenCalledWith(mapper);
      expect(ConverterFromNext.isConverterFromNext(transformedInstanceFiltered)).toBe(true);
      expect((transformedInstanceFiltered as ConverterFromNext<number>).arb).toBe(filteredInstance);
    });

    it('should unwrap instances of ConverterFromNext returned by map', () => {
      // Arrange
      const generate = jest.fn();
      const canGenerate = jest.fn();
      const shrink = jest.fn();
      const map = jest.fn();
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (canGenerate as any) as (v: unknown) => v is number;
        shrink = shrink;
        map = map;
      }
      class MyArbitrary extends Arbitrary<number> {
        generate = generate;
      }
      const originalInstance = new MyNextArbitrary();
      const mappedInstanceOld = new MyArbitrary();
      map.mockReturnValue(new ConverterToNext(mappedInstanceOld));
      const mapper = () => 0;

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const transformedInstanceMapped = transformedInstance.map(mapper);

      // Assert
      expect(ConverterFromNext.isConverterFromNext(transformedInstanceMapped)).toBe(false);
      expect(transformedInstanceMapped).toBe(mappedInstanceOld);
    });
  });

  describe('chain', () => {
    it('should call chain directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const canGenerate = jest.fn();
      const shrink = jest.fn();
      const chain = jest.fn();
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (canGenerate as any) as (v: unknown) => v is number;
        shrink = shrink;
        chain = chain;
      }
      const originalInstance = new MyNextArbitrary();
      const chainedInstance = new MyNextArbitrary();
      const outChainedInstance = new MyNextArbitrary();
      const outChainedInstanceNext = new ConverterFromNext(outChainedInstance);
      chain.mockReturnValue(chainedInstance);
      const chainer = () => outChainedInstanceNext;

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const transformedInstanceFiltered = transformedInstance.chain(chainer);

      // Assert
      expect(chain).toHaveBeenCalledTimes(1);
      expect(ConverterFromNext.isConverterFromNext(transformedInstanceFiltered)).toBe(true);
      expect((transformedInstanceFiltered as ConverterFromNext<number>).arb).toBe(chainedInstance);
    });
  });

  describe('noShrink', () => {
    it('should call noShrink directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const canGenerate = jest.fn();
      const shrink = jest.fn();
      const noShrink = jest.fn();
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (canGenerate as any) as (v: unknown) => v is number;
        shrink = shrink;
        noShrink = noShrink;
      }
      const originalInstance = new MyNextArbitrary();
      const noShrinkInstance = new MyNextArbitrary();
      noShrink.mockReturnValue(noShrinkInstance);

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const transformedInstanceFiltered = transformedInstance.noShrink();

      // Assert
      expect(noShrink).toHaveBeenCalledTimes(1);
      expect(ConverterFromNext.isConverterFromNext(transformedInstanceFiltered)).toBe(true);
      expect((transformedInstanceFiltered as ConverterFromNext<number>).arb).toBe(noShrinkInstance);
    });
  });

  describe('noBias', () => {
    it('should call noBias directly on the passed instance and convert its result', () => {
      // Arrange
      const generate = jest.fn();
      const canGenerate = jest.fn();
      const shrink = jest.fn();
      const noBias = jest.fn();
      class MyNextArbitrary extends NextArbitrary<number> {
        generate = generate;
        canGenerate = (canGenerate as any) as (v: unknown) => v is number;
        shrink = shrink;
        noBias = noBias;
      }
      const originalInstance = new MyNextArbitrary();
      const noShrinkInstance = new MyNextArbitrary();
      noBias.mockReturnValue(noShrinkInstance);

      // Act
      const transformedInstance = new ConverterFromNext(originalInstance);
      const transformedInstanceFiltered = transformedInstance.noBias();

      // Assert
      expect(noBias).toHaveBeenCalledTimes(1);
      expect(ConverterFromNext.isConverterFromNext(transformedInstanceFiltered)).toBe(true);
      expect((transformedInstanceFiltered as ConverterFromNext<number>).arb).toBe(noShrinkInstance);
    });
  });
});
