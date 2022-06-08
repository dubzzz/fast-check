import * as fc from 'fast-check';

import {
  float32raw,
  isNotNaN32bits,
  isStrictlySmaller,
  isFiniteNotNaN32bits,
} from '../../__test-helpers__/FloatingPointHelpers';
import {
  decomposeFloat,
  EPSILON_32,
  floatToIndex,
  indexToFloat,
  MAX_VALUE_32,
  MIN_VALUE_32,
} from '../../../../../src/arbitrary/_internals/helpers/FloatHelpers';

describe('decomposeFloat', () => {
  it('should properly decompose basic values', () => {
    expect(decomposeFloat(0)).toEqual({ exponent: -126, significand: 0 });
    expect(decomposeFloat(1)).toEqual({ exponent: 0, significand: 1 });
    expect(decomposeFloat(128)).toEqual({ exponent: 7, significand: 1 });
    expect(decomposeFloat(201)).toEqual({ exponent: 7, significand: 1.5703125 });
  });

  it('should properly decompose negative values', () => {
    expect(decomposeFloat(-0)).toEqual({ exponent: -126, significand: -0 });
    expect(decomposeFloat(-1)).toEqual({ exponent: 0, significand: -1 });
  });

  it('should properly decompose extreme values', () => {
    expect(decomposeFloat(MAX_VALUE_32)).toEqual({ exponent: 127, significand: 1 + (2 ** 23 - 1) / 2 ** 23 });
    expect(decomposeFloat(MIN_VALUE_32)).toEqual({ exponent: -126, significand: 2 ** -23 });
    expect(decomposeFloat(EPSILON_32)).toEqual({ exponent: -23, significand: 1 });
    expect(decomposeFloat(1 + EPSILON_32)).toEqual({ exponent: 0, significand: 1 + 2 ** -23 });
  });

  it('should decompose a 32-bit float into its equivalent (significand, exponent)', () => {
    fc.assert(
      fc.property(float32raw(), (f32) => {
        // Arrange
        fc.pre(isFiniteNotNaN32bits(f32));

        // Act
        const { exponent, significand } = decomposeFloat(f32);

        // Assert
        expect(significand * 2 ** exponent).toBe(f32);
      })
    );
  });
});

describe('floatToIndex', () => {
  it('should properly compute indexes', () => {
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
    // index(2) = index(1) + 2**23
    expect(floatToIndex(2)).toEqual(1073741824);
    expect(floatToIndex(MAX_VALUE_32)).toBe(2139095039);
  });

  it('should properly compute negative indexes', () => {
    expect(floatToIndex(-0)).toEqual(-1);
    expect(floatToIndex(-MIN_VALUE_32)).toBe(-2);
    expect(floatToIndex(-MAX_VALUE_32)).toBe(-2139095040);
  });

  it('should properly compute indexes for infinity', () => {
    expect(floatToIndex(Number.NEGATIVE_INFINITY)).toBe(floatToIndex(-MAX_VALUE_32) - 1);
    expect(floatToIndex(Number.POSITIVE_INFINITY)).toBe(floatToIndex(MAX_VALUE_32) + 1);
  });

  it('should be able to infer index for negative float from the positive one', () => {
    fc.assert(
      fc.property(float32raw(), (f) => {
        // Arrange
        fc.pre(isNotNaN32bits(f));
        const posD = f > 0 || 1 / f > 0 ? f : -f;

        // Act
        const indexPos = floatToIndex(posD);
        const indexNeg = floatToIndex(-posD);

        // Assert
        expect(indexNeg).toEqual(-indexPos - 1);
      })
    );
  });

  it('should return index +1 for the successor of a given float', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -126, max: +127 }),
        fc.integer({ min: 0, max: 2 ** 24 - 1 }),
        (exponent, rescaledSignificand) => {
          // Arrange
          fc.pre(exponent === -126 || rescaledSignificand >= 2 ** 23); // valid
          fc.pre(exponent !== 127 || rescaledSignificand !== 2 ** 24 - 1); // not max
          const current = rescaledSignificand * EPSILON_32 * 2 ** exponent;
          const next = (rescaledSignificand + 1) * EPSILON_32 * 2 ** exponent;

          // Act / Assert
          expect(floatToIndex(next)).toEqual(floatToIndex(current) + 1);
        }
      )
    );
  });

  it('should preserve ordering between two floats', () => {
    fc.assert(
      fc.property(float32raw(), float32raw(), (fa32, fb32) => {
        // Arrange
        fc.pre(isNotNaN32bits(fa32) && isNotNaN32bits(fb32));

        // Act / Assert
        if (isStrictlySmaller(fa32, fb32)) expect(floatToIndex(fa32)).toBeLessThan(floatToIndex(fb32));
        else expect(floatToIndex(fa32)).toBeGreaterThanOrEqual(floatToIndex(fb32));
      })
    );
  });
});

describe('indexToFloat', () => {
  it('should properly find floats corresponding to well-known values', () => {
    expect(indexToFloat(-2139095041)).toBe(Number.NEGATIVE_INFINITY);
    expect(indexToFloat(-2139095040)).toBe(-MAX_VALUE_32);
    expect(indexToFloat(-1)).toBe(-0);
    expect(indexToFloat(0)).toBe(0);
    expect(indexToFloat(872415232)).toBe(EPSILON_32);
    expect(indexToFloat(2139095039)).toBe(MAX_VALUE_32);
    expect(indexToFloat(2139095040)).toBe(Number.POSITIVE_INFINITY);
  });

  it('should only produce 32-bit floating point numbers (excluding NaN)', () => {
    fc.assert(
      fc.property(fc.integer({ min: -2139095041, max: 2139095040 }), (index) => {
        // Arrange / Act
        const f = indexToFloat(index);

        // Assert
        expect(f).toBe(new Float32Array([f])[0]);
      })
    );
  });

  it('should reverse floatToIndex', () => {
    fc.assert(
      fc.property(float32raw(), (f32) => {
        // Arrange
        fc.pre(isNotNaN32bits(f32));

        // Act / Assert
        expect(indexToFloat(floatToIndex(f32))).toBe(f32);
      })
    );
  });

  it('should be reversed by floatToIndex', () => {
    fc.assert(
      fc.property(fc.integer({ min: -2139095041, max: 2139095040 }), (index) => {
        // The test below checks that indexToFloat(floatToIndex) is identity
        // It does not confirm that floatToIndex(indexToFloat)) is identity
        expect(floatToIndex(indexToFloat(index))).toBe(index);
      })
    );
  });
});
