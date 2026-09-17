import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { float64raw, isStrictlySmaller } from '../../__test-helpers__/FloatingPointHelpers.js';
import {
  decomposeDouble,
  doubleToIndex,
  indexToDouble,
} from '../../../../../src/arbitrary/_internals/helpers/DoubleHelpers.js';

describe('decomposeDouble', () => {
  it('should properly decompose basic values', () => {
    expect(decomposeDouble(0)).toEqual({ exponent: -1022, significand: 0 });
    expect(decomposeDouble(1)).toEqual({ exponent: 0, significand: 1 });
    expect(decomposeDouble(128)).toEqual({ exponent: 7, significand: 1 });
    expect(decomposeDouble(201)).toEqual({ exponent: 7, significand: 1.5703125 });
  });

  it('should properly decompose negative values', () => {
    expect(decomposeDouble(-0)).toEqual({ exponent: -1022, significand: -0 });
    expect(decomposeDouble(-1)).toEqual({ exponent: 0, significand: -1 });
  });

  it('should properly decompose extreme values', () => {
    expect(decomposeDouble(Number.MAX_VALUE)).toEqual({ exponent: 1023, significand: 2 - Number.EPSILON });
    expect(decomposeDouble(Number.MIN_VALUE)).toEqual({ exponent: -1022, significand: Number.EPSILON });
    expect(decomposeDouble(Number.EPSILON)).toEqual({ exponent: -52, significand: 1 });
    expect(decomposeDouble(1 + Number.EPSILON)).toEqual({ exponent: 0, significand: 1 + Number.EPSILON });
  });

  it('should decompose a 64-bit float into its equivalent (significand, exponent)', async () => {
    await fc.assert(
      fc.asyncProperty(float64raw(), (f64) => {
        // Arrange
        fc.pre(!Number.isNaN(f64));

        // Act
        const { exponent, significand } = decomposeDouble(f64);

        // Assert
        expect(significand * 2 ** exponent).toBe(f64);
      }),
    );
  });
});

describe('doubleToIndex', () => {
  it('should properly compute indexes', () => {
    expect(doubleToIndex(0)).toEqual(0n);
    expect(doubleToIndex(Number.MIN_VALUE)).toEqual(1n);
    expect(doubleToIndex(2 * Number.MIN_VALUE)).toEqual(2n);
    expect(doubleToIndex(3 * Number.MIN_VALUE)).toEqual(3n);
    // Last double with minimal exponent, ie -1022
    // index(last with min exponent) = 2**53 - 1
    expect(doubleToIndex(2 ** -1022 * (2 - Number.EPSILON))).toEqual(9007199254740991n);
    // First double without minimal exponent, ie -1022
    // index(first without min exponent) = index(last with min exponent) + 1
    expect(doubleToIndex(2 ** -1021)).toEqual(9007199254740992n);
    // Number.EPSILON === 1. * 2**-52 --> m = 1, e = -52
    // index(Number.EPSILON) = 2**53 + (-52 - (-1022) -1) * 2**52
    expect(doubleToIndex(Number.EPSILON)).toEqual(4372995238176751616n);
    // index(1 - Number.EPSILON / 2) = index(1) - 1
    expect(doubleToIndex(1 - Number.EPSILON / 2)).toEqual(4607182418800017407n);
    // 1 === 1. * 2**0 --> m = 1, e = 0
    // index(1) = 2**53 + (0 - (-1022) -1) * 2**52
    expect(doubleToIndex(1)).toEqual(4607182418800017408n);
    // index(1 + Number.EPSILON) = index(1) + 1
    expect(doubleToIndex(1 + Number.EPSILON)).toEqual(4607182418800017409n);
    // index(2 - Number.EPSILON) = index(2) - 1 = index(1 + (2 ** 52 - 1) * Number.EPSILON)
    expect(doubleToIndex(2 - Number.EPSILON)).toEqual(4611686018427387903n);
    // 1 === 1. * 2**1 --> m = 1, e = 1
    // index(2) = index(1) + 2**52
    expect(doubleToIndex(2)).toEqual(4611686018427387904n);
    // Number.MAX_VALUE === (1 + (2**52-1)/2**52) * 2**1023 --> m = 1 + (2**52-1)/2**52, e = 1023
    // index(Number.MAX_VALUE) = index(next(Number.MAX_VALUE)) -1 = 2**53 + (1024 - (-1022) -1) * 2**52 -1
    expect(doubleToIndex(Number.MAX_VALUE)).toEqual(9218868437227405311n);
  });

  it('should properly compute negative indexes', () => {
    expect(doubleToIndex(-0)).toEqual(-1n);
    expect(doubleToIndex(-Number.MIN_VALUE)).toEqual(-2n);
    expect(doubleToIndex(-Number.MAX_VALUE)).toEqual(-9218868437227405312n);
  });

  it('should properly compute indexes for infinity', () => {
    expect(doubleToIndex(Number.NEGATIVE_INFINITY)).toEqual(BigInt(doubleToIndex(-Number.MAX_VALUE) - 1n));
    expect(doubleToIndex(Number.POSITIVE_INFINITY)).toEqual(BigInt(doubleToIndex(Number.MAX_VALUE) + 1n));
  });

  it('should be able to infer index for negative double from the positive one', async () => {
    await fc.assert(
      fc.asyncProperty(float64raw(), (d) => {
        // Arrange
        fc.pre(!Number.isNaN(d));
        const posD = d > 0 || 1 / d > 0 ? d : -d;

        // Act
        const bigIntIndexPos = doubleToIndex(posD);
        const bigIntIndexNeg = doubleToIndex(-posD);

        // Assert
        expect(bigIntIndexNeg).toEqual(-bigIntIndexPos - 1n);
      }),
    );
  });

  it('should return index +1 for the successor of a given double', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -1022, max: +1023 }),
        fc.integer({ min: 0, max: 2 ** 53 - 1 }),
        (exponent, rescaledSignificand) => {
          // Arrange
          fc.pre(exponent === -1022 || rescaledSignificand >= 2 ** 52); // valid
          fc.pre(exponent !== 1023 || rescaledSignificand !== 2 ** 53 - 1); // not max
          const current = rescaledSignificand * Number.EPSILON * 2 ** exponent;
          const next = (rescaledSignificand + 1) * Number.EPSILON * 2 ** exponent;

          // Act
          const bigIntIndexCurrent = doubleToIndex(current);
          const bigIntIndexNext = doubleToIndex(next);

          // Assert
          expect(bigIntIndexNext).toEqual(bigIntIndexCurrent + 1n);
        },
      ),
    );
  });

  it('should preserve ordering between two doubles', async () => {
    await fc.assert(
      fc.asyncProperty(float64raw(), float64raw(), (fa64, fb64) => {
        // Arrange
        fc.pre(!Number.isNaN(fa64) && !Number.isNaN(fb64));

        // Act / Assert
        if (isStrictlySmaller(fa64, fb64)) {
          expect(doubleToIndex(fa64)).toBeLessThan(doubleToIndex(fb64));
        } else {
          expect(doubleToIndex(fa64)).toBeGreaterThanOrEqual(doubleToIndex(fb64));
        }
      }),
    );
  });
});

describe('indexToDouble', () => {
  it('should reverse doubleToIndex', async () =>
    await fc.assert(
      fc.asyncProperty(float64raw(), (f64) => {
        fc.pre(!Number.isNaN(f64));
        expect(indexToDouble(doubleToIndex(f64))).toBe(f64);
      }),
    ));

  it('should properly find doubles corresponding to well-known values', () => {
    expect(indexToDouble(-9218868437227405313n)).toBe(Number.NEGATIVE_INFINITY);
    expect(indexToDouble(-9218868437227405312n)).toBe(-Number.MAX_VALUE);
    expect(indexToDouble(-1n)).toBe(-0);
    expect(indexToDouble(0n)).toBe(0);
    expect(indexToDouble(4372995238176751616n)).toBe(Number.EPSILON);
    expect(indexToDouble(9218868437227405311n)).toBe(Number.MAX_VALUE);
    expect(indexToDouble(9218868437227405312n)).toBe(Number.POSITIVE_INFINITY);
  });

  it('should be reversed by doubleToIndex', async () => {
    await fc.assert(
      fc.asyncProperty(fc.bigInt({ min: -9218868437227405313n, max: 9218868437227405312n }), (bigIntIndex) => {
        // The test below checks that indexToDouble(doubleToIndex) is identity
        // It does not confirm that doubleToIndex(indexToDouble)) is identity

        // Arrange
        const index = BigInt(bigIntIndex);

        // Act / Assert
        expect(doubleToIndex(indexToDouble(index))).toEqual(index);
      }),
    );
  });
});
