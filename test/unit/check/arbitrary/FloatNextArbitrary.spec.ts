import * as fc from '../../../../lib/fast-check';

import {
  decomposeFloat,
  floatToIndex,
  indexToFloat,
  EPSILON_32,
  MAX_VALUE_32,
  MIN_VALUE_32,
} from '../../../../src/check/arbitrary/FloatNextArbitrary';

describe('FloatNextArbitrary', () => {
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
        fc.property(
          fc.integer().map((n32) => new Float32Array(new Int32Array([n32]).buffer)[0]),
          (f32) => {
            fc.pre(!Number.isNaN(f32) && Number.isFinite(f32));
            const { exponent, significand } = decomposeFloat(f32);
            expect(significand * 2 ** exponent).toBe(f32);
          }
        )
      ));
  });
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
      fc.property(
        fc.integer().map((n32) => new Float32Array(new Int32Array([n32]).buffer)[0]),
        fc.integer().map((n32) => new Float32Array(new Int32Array([n32]).buffer)[0]),
        (fa32, fb32) => {
          fc.pre(!Number.isNaN(fa32) && Number.isFinite(fa32) && !Number.isNaN(fb32) && Number.isFinite(fb32));
          if (fa32 <= fb32) expect(floatToIndex(fa32)).toBeLessThanOrEqual(floatToIndex(fb32));
          else expect(floatToIndex(fa32)).toBeGreaterThan(floatToIndex(fb32));
        }
      )
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
      fc.property(
        fc.integer().map((n32) => new Float32Array(new Int32Array([n32]).buffer)[0]),
        (f32) => {
          fc.pre(!Number.isNaN(f32) && Number.isFinite(f32));
          expect(indexToFloat(floatToIndex(f32))).toBe(f32);
        }
      )
    ));
});
