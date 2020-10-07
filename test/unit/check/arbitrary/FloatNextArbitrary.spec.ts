import * as fc from '../../../../lib/fast-check';

import {
  decomposeFloat,
  floatToIndex,
  indexToFloat,
  EPSILON_32,
  MAX_VALUE_32,
  MIN_VALUE_32,
  floatNext,
  FloatNextConstraints,
} from '../../../../src/check/arbitrary/FloatNextArbitrary';
import * as genericHelper from './generic/GenericArbitraryHelper';

const float32raw = () => {
  return fc.integer().map((n32) => new Float32Array(new Int32Array([n32]).buffer)[0]);
};
const float64raw = () => {
  return fc
    .tuple(fc.integer(), fc.integer())
    .map(([na32, nb32]) => new Float64Array(new Int32Array([na32, nb32]).buffer)[0]);
};
const floatNextConstraints = () => {
  return fc
    .record({ min: float32raw(), max: float32raw() }, { withDeletedKeys: true })
    .filter((ct) => {
      return (
        (ct.min === undefined || (Number.isFinite(ct.min) && !Number.isNaN(ct.min))) &&
        (ct.max === undefined || (Number.isFinite(ct.max) && !Number.isNaN(ct.max)))
      );
    })
    .map((ct) => {
      if (ct.min === undefined || ct.max === undefined) return ct;
      const { min, max } = ct;
      if (min < max) return ct;
      if (min === max && (min !== 0 || 1 / min <= 1 / max)) return ct;
      return { min: max, max: min };
    });
};

const is32bits = (f64: number) => new Float32Array([f64])[0] === f64;
const isFiniteNotNaN32bits = (f64: number) => Number.isFinite(f64) && !Number.isNaN(f64) && is32bits(f64);

describe('FloatNextArbitrary', () => {
  describe('floatNext', () => {
    it('Should accept any valid range of 32-bit floating point numbers', () =>
      fc.assert(
        fc.property(floatNextConstraints(), (ct) => {
          expect(floatNext(ct)).toBeDefined();
        })
      ));
    it('Should reject non-32-bit, NaN or Infinity floating point numbers if specified for min', () =>
      fc.assert(
        fc.property(float64raw(), (f64) => {
          fc.pre(!isFiniteNotNaN32bits(f64));
          expect(() => floatNext({ min: f64 })).toThrowError();
        })
      ));
    it('Should reject non-32-bit, NaN or Infinity floating point numbers if specified for max', () =>
      fc.assert(
        fc.property(float64raw(), (f64) => {
          fc.pre(!isFiniteNotNaN32bits(f64));
          expect(() => floatNext({ max: f64 })).toThrowError();
        })
      ));
    it('Should reject if specified min is strictly greater than max', () =>
      fc.assert(
        fc.property(float32raw(), float32raw(), (fa32, fb32) => {
          fc.pre(isFiniteNotNaN32bits(fa32));
          fc.pre(isFiniteNotNaN32bits(fb32));
          fc.pre(fa32 !== fb32);
          const min = fa32 < fb32 ? fb32 : fa32;
          const max = fa32 < fb32 ? fa32 : fb32;
          expect(() => floatNext({ min, max })).toThrowError();
        })
      ));
    describe('Is valid arbitrary?', () => {
      genericHelper.isValidArbitrary((ct?: FloatNextConstraints) => floatNext(ct), {
        isStrictlySmallerValue: (fa, fb) => Math.abs(fa) < Math.abs(fb),
        isValidValue: (g: number, ct?: FloatNextConstraints) => {
          if (typeof g !== 'number') return false;
          if (!isFiniteNotNaN32bits(g)) return false;
          if (ct !== undefined && ct.min !== undefined && g < ct.min) return false;
          if (ct !== undefined && ct.max !== undefined && g > ct.max) return false;
          return true;
        },
        seedGenerator: fc.option(floatNextConstraints(), { nil: undefined }),
      });
    });
  });

  describe('decomposeFloat (@internal)', () => {
    it('Should properly decompose basic values', () => {
      expect(decomposeFloat(0)).toEqual({ exponent: -126, significand: 0 });
      expect(decomposeFloat(1)).toEqual({ exponent: 0, significand: 1 });
      expect(decomposeFloat(128)).toEqual({ exponent: 7, significand: 1 });
      expect(decomposeFloat(201)).toEqual({ exponent: 7, significand: 1.5703125 });
    });
    it('Should properly decompose negative values', () => {
      expect(decomposeFloat(-0)).toEqual({ exponent: -126, significand: -0 });
      expect(decomposeFloat(-1)).toEqual({ exponent: 0, significand: -1 });
    });
    it('Should properly decompose extreme values', () => {
      expect(decomposeFloat(MAX_VALUE_32)).toEqual({ exponent: 127, significand: 1 + (2 ** 23 - 1) / 2 ** 23 });
      expect(decomposeFloat(MIN_VALUE_32)).toEqual({ exponent: -126, significand: 2 ** -23 });
      expect(decomposeFloat(EPSILON_32)).toEqual({ exponent: -23, significand: 1 });
      expect(decomposeFloat(1 + EPSILON_32)).toEqual({ exponent: 0, significand: 1 + 2 ** -23 });
    });
    it('Should decompose a 32-bit float into its equivalent (significand, exponent)', () =>
      fc.assert(
        fc.property(float32raw(), (f32) => {
          fc.pre(isFiniteNotNaN32bits(f32));
          const { exponent, significand } = decomposeFloat(f32);
          expect(significand * 2 ** exponent).toBe(f32);
        })
      ));
  });

  describe('floatToIndex (@internal)', () => {
    it('Should properly compute indexes', () => {
      expect(floatToIndex(0)).toBe(0);
      expect(floatToIndex(MIN_VALUE_32)).toBe(1);
      expect(floatToIndex(2 * MIN_VALUE_32)).toBe(2);
      expect(floatToIndex(3 * MIN_VALUE_32)).toBe(3);
      // EPSILON_32 === 1. * 2**-23 --> m = 1, e = -23
      // index(EPSILON_32) = 2**24 + (-23 - (-126) -1) * 2**23
      expect(floatToIndex(EPSILON_32)).toBe(872415232);
      // index(1 - EPSILON_32 / 2) = index(1) - 1
      expect(floatToIndex(1 - EPSILON_32 / 2)).toEqual(1065353215);
      // 1 === 1. * 2**0 --> m = 1, e = 0
      // index(1) = 2**24 + (0 - (-126) -1) * 2**23
      expect(floatToIndex(1)).toEqual(1065353216);
      // index(1 + EPSILON_32) = index(1) + 1
      expect(floatToIndex(1 + EPSILON_32)).toEqual(1065353217);
      // index(2 - EPSILON_32) = index(2) - 1 = index(1 + (2 ** 23 - 1) * EPSILON_32)
      expect(floatToIndex(2 - EPSILON_32)).toEqual(1073741823);
      // 1 === 1. * 2**1 --> m = 1, e = 1
      // index(2) = index(1) * 2**23
      expect(floatToIndex(2)).toEqual(1073741824);
      expect(floatToIndex(MAX_VALUE_32)).toBe(2139095039);
    });
    it('Should properly compute negative indexes', () => {
      expect(floatToIndex(-0)).toEqual(-1);
      expect(floatToIndex(-MIN_VALUE_32)).toBe(-2);
      expect(floatToIndex(-MAX_VALUE_32)).toBe(-2139095040);
    });
    it('Should preserve ordering between two floats', () =>
      fc.assert(
        fc.property(float32raw(), float32raw(), (fa32, fb32) => {
          fc.pre(isFiniteNotNaN32bits(fa32) && isFiniteNotNaN32bits(fb32));
          if (fa32 <= fb32) expect(floatToIndex(fa32)).toBeLessThanOrEqual(floatToIndex(fb32));
          else expect(floatToIndex(fa32)).toBeGreaterThan(floatToIndex(fb32));
        })
      ));
  });

  describe('indexToFloat (@internal)', () => {
    it('Should only produce 32-bit floating point numbers', () =>
      fc.assert(
        fc.property(fc.integer(-2139095040, 2139095039), (index) => {
          const f = indexToFloat(index);
          expect(f).toBe(new Float32Array([f])[0]);
        })
      ));
    it('Should reverse floatToIndex', () =>
      fc.assert(
        fc.property(float32raw(), (f32) => {
          fc.pre(isFiniteNotNaN32bits(f32));
          expect(indexToFloat(floatToIndex(f32))).toBe(f32);
        })
      ));
    it('Should be reversed by floatToIndex', () =>
      fc.assert(
        fc.property(fc.integer(-2139095040, 2139095039), (index) => {
          // The test below checks that indexToFloat(floatToIndex) is identity
          // It does not confirm that floatToIndex(indexToFloat)) is identity
          expect(floatToIndex(indexToFloat(index))).toBe(index);
        })
      ));
  });
});
