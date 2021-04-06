import { LazyArbitrary, letrec as letrecOld } from '../../../../src/check/arbitrary/LetRecArbitrary';
import { NextArbitrary } from '../../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';

import * as stubRng from '../../stubs/generators';
import { convertFromNext, convertToNext } from '../../../../src/check/arbitrary/definition/Converters';
import { fakeNextArbitrary } from './generic/NextArbitraryHelpers';
import { Stream } from '../../../../src/stream/Stream';

const mrngNoCall = stubRng.mutable.nocall();

// Temporary rewrapping around letrec
// Should be removed with next major (no more Arbitrary, only NextArbitrary)
export function letrec<T>(
  builder: (tie: (key: string) => NextArbitrary<unknown>) => { [K in keyof T]: NextArbitrary<T[K]> }
): { [K in keyof T]: NextArbitrary<T[K]> } {
  const outOld = letrecOld((tieOld) => {
    const tie: (key: string) => NextArbitrary<unknown> = (key) => convertToNext(tieOld(key));
    const built = builder(tie);
    const revampedBuilt: { [K in keyof T]: Arbitrary<T[K]> } = Object.create(null);
    for (const k of Object.keys(built)) {
      revampedBuilt[k as keyof T] = convertFromNext(built[k as keyof T]);
    }
    return revampedBuilt;
  });
  const out: { [K in keyof T]: NextArbitrary<T[K]> } = Object.create(null);
  for (const k of Object.keys(outOld)) {
    out[k as keyof T] = convertToNext(outOld[k as keyof T]);
  }
  return out;
}

describe('letrec', () => {
  describe('builder', () => {
    it('should be able to construct independant arbitraries', () => {
      // Arrange
      const { instance: expectedArb1 } = fakeNextArbitrary();
      const { instance: expectedArb2 } = fakeNextArbitrary();

      // Act
      const { arb1, arb2 } = letrec((_tie) => ({
        arb1: expectedArb1,
        arb2: expectedArb2,
      }));

      // Assert
      expect(arb1).toBe(expectedArb1);
      expect(arb2).toBe(expectedArb2);
    });

    it('should not produce LazyArbitrary for no-tie constructs', () => {
      // Arrange
      const { instance: expectedArb } = fakeNextArbitrary();

      // Act
      const { arb } = letrec((_tie) => ({
        arb: expectedArb,
      }));

      // Assert
      expect(arb).not.toBeInstanceOf(LazyArbitrary);
    });

    it('should not produce LazyArbitrary for indirect tie constructs', () => {
      // Arrange / Act
      const { arb } = letrec((tie) => {
        const { instance: expectedArb, generate } = fakeNextArbitrary();
        generate.mockImplementation((...args) => tie('arb').generate(...args));
        return {
          // arb is an arbitrary wrapping the tie value (as fc.array)
          arb: expectedArb,
        };
      });

      // Assert
      expect(arb).not.toBeInstanceOf(LazyArbitrary);
    });

    it('should produce LazyArbitrary for direct tie constructs', () => {
      // Arrange / Act
      const { arb } = letrec((tie) => ({
        arb: tie('arb'),
      }));

      // Assert
      expect(arb).toBeInstanceOf(LazyArbitrary);
    });

    it('should be able to construct mutually recursive arbitraries', () => {
      // Arrange / Act
      const { arb1, arb2 } = letrec((tie) => ({
        arb1: tie('arb2'),
        arb2: tie('arb1'),
      }));

      // Assert
      expect(arb1).toBeDefined();
      expect(arb2).toBeDefined();
    });

    it('should apply tie correctly', () => {
      // Arrange
      const { instance: expectedArb } = fakeNextArbitrary();

      // Act
      const { arb1, arb2, arb3 } = letrec((tie) => ({
        arb1: tie('arb2'),
        arb2: tie('arb3'),
        arb3: expectedArb,
      }));

      // Assert
      expect(arb1).toBeInstanceOf(LazyArbitrary);
      expect(arb2).toBeInstanceOf(LazyArbitrary);
      expect(arb3).not.toBeInstanceOf(LazyArbitrary);
      expect(((arb1 as any) as LazyArbitrary).underlying).toBe(arb2);
      expect(((arb2 as any) as LazyArbitrary).underlying).toBe(arb3);
      expect(arb3).toBe(expectedArb);
    });
  });

  describe('generate', () => {
    it('should be able to delay calls to tie to generate', () => {
      // Arrange
      const biasFactor = 69;
      const { instance: simpleArb, generate } = fakeNextArbitrary();
      generate.mockReturnValueOnce(new NextValue(null));

      // Act
      const { arb1 } = letrec((tie) => {
        const { instance: simpleArb2, generate: generate2 } = fakeNextArbitrary();
        generate2.mockImplementation((...args) => tie('arb2').generate(...args));
        return {
          arb1: simpleArb2,
          arb2: simpleArb,
        };
      });
      expect(generate).not.toHaveBeenCalled();
      arb1.generate(mrngNoCall, biasFactor);

      // Assert
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall, biasFactor);
    });

    it('should throw on generate if tie receives an invalid parameter', () => {
      // Arrange
      const biasFactor = 42;
      const { arb1 } = letrec((tie) => ({
        arb1: tie('missing'),
      }));

      // Act / Assert
      expect(() => arb1.generate(mrngNoCall, biasFactor)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"missing\\" not correctly initialized"`
      );
    });

    it('should throw on generate if tie receives an invalid parameter after creation', () => {
      // Arrange
      const biasFactor = 42;
      const { arb1 } = letrec((tie) => {
        const { instance: simpleArb, generate } = fakeNextArbitrary();
        generate.mockImplementation((...args) => tie('missing').generate(...args));
        return {
          arb1: simpleArb,
        };
      });

      // Act / Assert
      expect(() => arb1.generate(mrngNoCall, biasFactor)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"missing\\" not correctly initialized"`
      );
    });

    it('should accept "reserved" keys as output of builder', () => {
      // Arrange
      const biasFactor = 42;
      const { instance: simpleArb, generate } = fakeNextArbitrary();
      generate.mockReturnValueOnce(new NextValue(null));
      const { tie } = letrec((tie) => ({
        tie: tie('__proto__'),
        ['__proto__']: tie('__defineGetter__​​'),
        ['__defineGetter__​​']: tie('__defineSetter__​​'),
        ['__defineSetter__​​']: tie('__lookupGetter__​​'),
        ['__lookupGetter__​​']: tie('__lookupSetter__​​'),
        ['__lookupSetter__​​']: tie('constructor​​'),
        ['constructor​​']: tie('hasOwnProperty​​'),
        ['hasOwnProperty​​']: tie('isPrototypeOf​​'),
        ['isPrototypeOf​​']: tie('propertyIsEnumerable​​'),
        ['propertyIsEnumerable​​']: tie('toLocaleString​​'),
        ['toLocaleString​​']: tie('toSource​​'),
        ['toSource​​']: tie('toString​​'),
        ['toString​​']: tie('valueOf'),
        ['valueOf']: simpleArb,
      }));

      // Act
      expect(generate).not.toHaveBeenCalled();
      tie.generate(mrngNoCall, biasFactor);

      // Assert
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall, biasFactor);
    });

    it('Should accept builders producing objects based on Object.create(null)', () => {
      // Arrange
      const biasFactor = 42;
      const { instance: simpleArb, generate } = fakeNextArbitrary();
      generate.mockReturnValueOnce(new NextValue(null));
      const { a } = letrec((tie) =>
        Object.assign(Object.create(null), {
          a: tie('b'),
          b: simpleArb,
        })
      );

      // Act
      expect(generate).not.toHaveBeenCalled();
      a.generate(mrngNoCall, biasFactor);

      // Assert
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall, biasFactor);
    });
  });

  describe('canGenerate', () => {
    it.each`
      expectedStatus
      ${false}
      ${true}
    `('should call canGenerate on the targets', ({ expectedStatus }) => {
      // Arrange
      const expectedValue = Symbol();
      const { instance: simpleArb, canGenerate } = fakeNextArbitrary();
      canGenerate.mockReturnValueOnce(expectedStatus);
      const { arb1 } = letrec((tie) => {
        return {
          arb1: tie('arb2'),
          arb2: simpleArb,
        };
      });

      // Act
      const out = arb1.canGenerate(expectedValue);

      // Assert
      expect(canGenerate).toHaveBeenCalledTimes(1);
      expect(canGenerate).toHaveBeenCalledWith(expectedValue);
      expect(out).toBe(expectedStatus);
    });

    it('should throw on canGenerate if tie receives an invalid parameter', () => {
      // Arrange
      const expectedValue = Symbol();
      const { arb1 } = letrec((tie) => ({
        arb1: tie('missing'),
      }));

      // Act / Assert
      expect(() => arb1.canGenerate(expectedValue)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"missing\\" not correctly initialized"`
      );
    });
  });

  describe('shrink', () => {
    it('should call shrink on the targets', () => {
      // Arrange
      const expectedValue = Symbol();
      const expectedContext = Symbol();
      const expectedStream = Stream.of(new NextValue(Symbol()));
      const { instance: simpleArb, shrink } = fakeNextArbitrary();
      shrink.mockReturnValueOnce(expectedStream);
      const { arb1 } = letrec((tie) => {
        return {
          arb1: tie('arb2'),
          arb2: simpleArb,
        };
      });

      // Act
      const out = arb1.shrink(expectedValue, expectedContext);

      // Assert
      expect(shrink).toHaveBeenCalledTimes(1);
      expect(shrink).toHaveBeenCalledWith(expectedValue, expectedContext);
      expect(out).toBe(expectedStream);
    });

    it('should throw on shrink if tie receives an invalid parameter', () => {
      // Arrange
      const expectedValue = Symbol();
      const expectedContext = Symbol();
      const { arb1 } = letrec((tie) => ({
        arb1: tie('missing'),
      }));

      // Act / Assert
      expect(() => arb1.shrink(expectedValue, expectedContext)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"missing\\" not correctly initialized"`
      );
    });
  });

  describe('LazyArbitrary (internal)', () => {
    it('should fail to generate when no underlying arbitrary', () => {
      // Arrange / Act
      const lazy = new LazyArbitrary('id007');

      // Assert
      expect(() => lazy.generate(mrngNoCall, 2)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"id007\\" not correctly initialized"`
      );
    });

    it('should fail to check canGenerate when no underlying arbitrary', () => {
      // Arrange / Act
      const lazy = new LazyArbitrary('id007');

      // Assert
      expect(() => lazy.canGenerate(1)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"id007\\" not correctly initialized"`
      );
    });

    it('should fail to shrink when no underlying arbitrary', () => {
      // Arrange / Act
      const lazy = new LazyArbitrary('id007');

      // Assert
      expect(() => lazy.shrink(1, 2)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"id007\\" not correctly initialized"`
      );
    });
  });
});
