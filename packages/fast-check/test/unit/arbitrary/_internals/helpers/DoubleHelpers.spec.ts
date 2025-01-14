import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { float64raw, isStrictlySmaller } from '../../__test-helpers__/FloatingPointHelpers';
import {
  decomposeDouble,
  doubleToIndex,
  indexToDouble,
} from '../../../../../src/arbitrary/_internals/helpers/DoubleHelpers';

type Index = ReturnType<typeof doubleToIndex>;
const toIndex = (raw: bigint | string): Index => {
  const b = typeof raw === 'string' ? BigInt(raw) : raw;
  const pb = b < BigInt(0) ? -b : b;
  return { sign: b < BigInt(0) ? -1 : 1, data: [Number(pb >> BigInt(32)), Number(pb & BigInt(0xffffffff))] };
};
const toBigInt = (index: Index): bigint => {
  return BigInt(index.sign) * ((BigInt(index.data[0]) << BigInt(32)) + BigInt(index.data[1]));
};

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

  it('should decompose a 64-bit float into its equivalent (significand, exponent)', () => {
    fc.assert(
      fc.property(float64raw(), (f64) => {
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
  it('should always produce well-formed indexes', () => {
    fc.assert(
      fc.property(float64raw(), (d) => {
        // Arrange
        fc.pre(!Number.isNaN(d));

        // Act
        const index = doubleToIndex(d);

        // Assert
        expect(index.data[0]).toBeGreaterThanOrEqual(0);
        expect(index.data[0]).toBeLessThanOrEqual(0xffffffff);
        expect(Number.isInteger(index.data[0])).toBe(true);
        expect(index.data[1]).toBeGreaterThanOrEqual(0);
        expect(index.data[1]).toBeLessThanOrEqual(0xffffffff);
        expect(Number.isInteger(index.data[1])).toBe(true);
      }),
    );
  });

  it('should properly compute indexes', () => {
    expect(doubleToIndex(0)).toEqual(toIndex('0'));
    expect(doubleToIndex(Number.MIN_VALUE)).toEqual(toIndex('1'));
    expect(doubleToIndex(2 * Number.MIN_VALUE)).toEqual(toIndex('2'));
    expect(doubleToIndex(3 * Number.MIN_VALUE)).toEqual(toIndex('3'));
    // Last double with minimal exponent, ie -1022
    // index(last with min exponent) = 2**53 - 1
    expect(doubleToIndex(2 ** -1022 * (2 - Number.EPSILON))).toEqual(toIndex('9007199254740991'));
    // First double without minimal exponent, ie -1022
    // index(first without min exponent) = index(last with min exponent) + 1
    expect(doubleToIndex(2 ** -1021)).toEqual(toIndex('9007199254740992'));
    // Number.EPSILON === 1. * 2**-52 --> m = 1, e = -52
    // index(Number.EPSILON) = 2**53 + (-52 - (-1022) -1) * 2**52
    expect(doubleToIndex(Number.EPSILON)).toEqual(toIndex('4372995238176751616'));
    // index(1 - Number.EPSILON / 2) = index(1) - 1
    expect(doubleToIndex(1 - Number.EPSILON / 2)).toEqual(toIndex('4607182418800017407'));
    // 1 === 1. * 2**0 --> m = 1, e = 0
    // index(1) = 2**53 + (0 - (-1022) -1) * 2**52
    expect(doubleToIndex(1)).toEqual(toIndex('4607182418800017408'));
    // index(1 + Number.EPSILON) = index(1) + 1
    expect(doubleToIndex(1 + Number.EPSILON)).toEqual(toIndex('4607182418800017409'));
    // index(2 - Number.EPSILON) = index(2) - 1 = index(1 + (2 ** 52 - 1) * Number.EPSILON)
    expect(doubleToIndex(2 - Number.EPSILON)).toEqual(toIndex('4611686018427387903'));
    // 1 === 1. * 2**1 --> m = 1, e = 1
    // index(2) = index(1) + 2**52
    expect(doubleToIndex(2)).toEqual(toIndex('4611686018427387904'));
    // Number.MAX_VALUE === (1 + (2**52-1)/2**52) * 2**1023 --> m = 1 + (2**52-1)/2**52, e = 1023
    // index(Number.MAX_VALUE) = index(next(Number.MAX_VALUE)) -1 = 2**53 + (1024 - (-1022) -1) * 2**52 -1
    expect(doubleToIndex(Number.MAX_VALUE)).toEqual(toIndex('9218868437227405311'));
  });

  it('should properly compute negative indexes', () => {
    expect(doubleToIndex(-0)).toEqual(toIndex('-1'));
    expect(doubleToIndex(-Number.MIN_VALUE)).toEqual(toIndex('-2'));
    expect(doubleToIndex(-Number.MAX_VALUE)).toEqual(toIndex('-9218868437227405312'));
  });

  it('should properly compute indexes for infinity', () => {
    expect(doubleToIndex(Number.NEGATIVE_INFINITY)).toEqual(
      toIndex(toBigInt(doubleToIndex(-Number.MAX_VALUE)) - BigInt(1)),
    );
    expect(doubleToIndex(Number.POSITIVE_INFINITY)).toEqual(
      toIndex(toBigInt(doubleToIndex(Number.MAX_VALUE)) + BigInt(1)),
    );
  });

  it('should be able to infer index for negative double from the positive one', () => {
    fc.assert(
      fc.property(float64raw(), (d) => {
        // Arrange
        fc.pre(!Number.isNaN(d));
        const posD = d > 0 || 1 / d > 0 ? d : -d;

        // Act
        const bigIntIndexPos = toBigInt(doubleToIndex(posD));
        const bigIntIndexNeg = toBigInt(doubleToIndex(-posD));

        // Assert
        expect(bigIntIndexNeg).toEqual(-bigIntIndexPos - BigInt(1));
      }),
    );
  });

  it('should return index +1 for the successor of a given double', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1022, max: +1023 }),
        fc.integer({ min: 0, max: 2 ** 53 - 1 }),
        (exponent, rescaledSignificand) => {
          // Arrange
          fc.pre(exponent === -1022 || rescaledSignificand >= 2 ** 52); // valid
          fc.pre(exponent !== 1023 || rescaledSignificand !== 2 ** 53 - 1); // not max
          const current = rescaledSignificand * Number.EPSILON * 2 ** exponent;
          const next = (rescaledSignificand + 1) * Number.EPSILON * 2 ** exponent;

          // Act
          const bigIntIndexCurrent = toBigInt(doubleToIndex(current));
          const bigIntIndexNext = toBigInt(doubleToIndex(next));

          // Assert
          expect(bigIntIndexNext).toEqual(bigIntIndexCurrent + BigInt(1));
        },
      ),
    );
  });

  it('should preserve ordering between two doubles', () => {
    fc.assert(
      fc.property(float64raw(), float64raw(), (fa64, fb64) => {
        // Arrange
        fc.pre(!Number.isNaN(fa64) && !Number.isNaN(fb64));

        // Act / Assert
        if (isStrictlySmaller(fa64, fb64)) {
          expect(toBigInt(doubleToIndex(fa64))).toBeLessThan(toBigInt(doubleToIndex(fb64)));
        } else {
          expect(toBigInt(doubleToIndex(fa64))).toBeGreaterThanOrEqual(toBigInt(doubleToIndex(fb64)));
        }
      }),
    );
  });
});

describe('indexToDouble', () => {
  it('Should reverse doubleToIndex', () =>
    fc.assert(
      fc.property(float64raw(), (f64) => {
        fc.pre(!Number.isNaN(f64));
        expect(indexToDouble(doubleToIndex(f64))).toBe(f64);
      }),
    ));

  it('should properly find doubles corresponding to well-known values', () => {
    expect(indexToDouble(toIndex('-9218868437227405313'))).toBe(Number.NEGATIVE_INFINITY);
    expect(indexToDouble(toIndex('-9218868437227405312'))).toBe(-Number.MAX_VALUE);
    expect(indexToDouble(toIndex('-1'))).toBe(-0);
    expect(indexToDouble(toIndex('0'))).toBe(0);
    expect(indexToDouble(toIndex('4372995238176751616'))).toBe(Number.EPSILON);
    expect(indexToDouble(toIndex('9218868437227405311'))).toBe(Number.MAX_VALUE);
    expect(indexToDouble(toIndex('9218868437227405312'))).toBe(Number.POSITIVE_INFINITY);
  });

  it('should be reversed by doubleToIndex', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: BigInt('-9218868437227405313'), max: BigInt('9218868437227405312') }),
        (bigIntIndex) => {
          // The test below checks that indexToDouble(doubleToIndex) is identity
          // It does not confirm that doubleToIndex(indexToDouble)) is identity

          // Arrange
          const index = toIndex(bigIntIndex);

          // Act / Assert
          expect(doubleToIndex(indexToDouble(index))).toEqual(index);
        },
      ),
    );
  });
});
