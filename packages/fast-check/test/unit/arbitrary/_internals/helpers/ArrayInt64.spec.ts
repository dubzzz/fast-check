import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import type { ArrayInt64 } from '../../../../../src/arbitrary/_internals/helpers/ArrayInt64';
import {
  add64,
  halve64,
  isEqual64,
  isStrictlySmaller64,
  logLike64,
  negative64,
  substract64,
} from '../../../../../src/arbitrary/_internals/helpers/ArrayInt64';

function toArrayInt64(b: bigint, withNegativeZero: boolean): ArrayInt64 {
  const posB = b < BigInt(0) ? -b : b;
  return {
    sign: b < BigInt(0) || (withNegativeZero && b === BigInt(0)) ? -1 : 1,
    data: [Number(posB >> BigInt(32)), Number(posB & ((BigInt(1) << BigInt(32)) - BigInt(1)))],
  };
}

function toBigInt(a: ArrayInt64): bigint {
  return BigInt(a.sign) * ((BigInt(a.data[0]) << BigInt(32)) + BigInt(a.data[1]));
}

function expectValidArrayInt(a: ArrayInt64): void {
  expect([-1, 1]).toContain(a.sign);
  expect(a.data[0]).toBeGreaterThanOrEqual(0);
  expect(a.data[0]).toBeLessThanOrEqual(0xffffffff);
  expect(a.data[1]).toBeGreaterThanOrEqual(0);
  expect(a.data[1]).toBeLessThanOrEqual(0xffffffff);
}

function expectValidZeroIfAny(a: ArrayInt64): void {
  if (a.data[0] === 0 && a.data[1] === 0) {
    expect(a.sign).toBe(1);
  }
}

describe('ArrayInt64', () => {
  const MaxArrayIntValue = (BigInt(1) << BigInt(64)) - BigInt(1);

  describe('isEqual64', () => {
    it('should consider identical values as equal', () => {
      fc.assert(
        fc.property(fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }), (a) => {
          // Arrange
          const a64 = toArrayInt64(a, false);
          const a64Cloned = toArrayInt64(a, false);

          // Act
          const out = isEqual64(a64, a64Cloned);

          // Assert
          expect(out).toBe(true);
        }),
      );
    });

    it('should consider two different values as not equal', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, b, na, nb) => {
            // Arrange
            fc.pre(a !== b);
            const a64 = toArrayInt64(a, na);
            const b64 = toArrayInt64(b, nb);

            // Act
            const out = isEqual64(a64, b64);

            // Assert
            expect(out).toBe(false);
          },
        ),
      );
    });

    it('should consider zero and -zero to be equal', () => {
      expect(isEqual64({ sign: -1, data: [0, 0] }, { sign: -1, data: [0, 0] })).toBe(true);
      expect(isEqual64({ sign: 1, data: [0, 0] }, { sign: -1, data: [0, 0] })).toBe(true);
      expect(isEqual64({ sign: -1, data: [0, 0] }, { sign: 1, data: [0, 0] })).toBe(true);
      expect(isEqual64({ sign: 1, data: [0, 0] }, { sign: 1, data: [0, 0] })).toBe(true);
    });
  });

  describe('isStrictlySmaller64', () => {
    it('should properly compare two ArrayInt64 (including negative zeros)', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, b, na, nb) => {
            // Arrange
            const a64 = toArrayInt64(a, na);
            const b64 = toArrayInt64(b, nb);

            // Act
            const out = isStrictlySmaller64(a64, b64);

            // Assert
            expect(out).toBe(a < b);
          },
        ),
      );
    });

    it('should consider zero and -zero as equal values (never strictly smaller that the other)', () => {
      expect(isStrictlySmaller64({ sign: -1, data: [0, 0] }, { sign: -1, data: [0, 0] })).toBe(false);
      expect(isStrictlySmaller64({ sign: 1, data: [0, 0] }, { sign: -1, data: [0, 0] })).toBe(false);
      expect(isStrictlySmaller64({ sign: -1, data: [0, 0] }, { sign: 1, data: [0, 0] })).toBe(false);
      expect(isStrictlySmaller64({ sign: 1, data: [0, 0] }, { sign: 1, data: [0, 0] })).toBe(false);
    });
  });

  describe('substract64', () => {
    it('should properly substract two ArrayInt64 (including negative zeros)', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, b, na, nb) => {
            // Arrange
            const expectedResult = a - b;
            fc.pre(expectedResult >= -MaxArrayIntValue);
            fc.pre(expectedResult <= MaxArrayIntValue);
            const a64 = toArrayInt64(a, na);
            const b64 = toArrayInt64(b, nb);

            // Act
            const result64 = substract64(a64, b64);

            // Assert
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(toBigInt(result64)).toBe(expectedResult);
          },
        ),
      );
    });

    it('should equal to first term if second one is zero', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, na, nb) => {
            // Arrange
            const a64 = toArrayInt64(a, na);
            const b64 = toArrayInt64(BigInt(0), nb);

            // Act
            const result64 = substract64(a64, b64);

            // Assert
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(result64).toEqual(toArrayInt64(a, false)); // toArrayInt64(a, false): sign must be + for 0
          },
        ),
      );
    });

    it('should equal to minus second term if first one is zero', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, na, nb) => {
            // Arrange
            const z64 = toArrayInt64(BigInt(0), nb);
            const a64 = toArrayInt64(a, na);

            // Act
            const result64 = substract64(z64, a64);

            // Assert
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(result64).toEqual(toArrayInt64(-a, false)); // toArrayInt64(-a, false): sign must be + for 0
          },
        ),
      );
    });

    it('should equal to zero when substracting zeros', () => {
      const negZero: ArrayInt64 = { sign: -1, data: [0, 0] };
      const posZero: ArrayInt64 = { sign: 1, data: [0, 0] };
      expect(substract64(negZero, negZero)).toEqual(posZero);
      expect(substract64(negZero, posZero)).toEqual(posZero);
      expect(substract64(posZero, negZero)).toEqual(posZero);
      expect(substract64(posZero, posZero)).toEqual(posZero);
    });
  });

  describe('negative64', () => {
    it('should properly negate an ArrayInt64 (including negative zeros)', () => {
      fc.assert(
        fc.property(fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }), fc.boolean(), (a, na) => {
          // Arrange
          const expectedResult = -a;
          const a64 = toArrayInt64(a, na);

          // Act
          const result64 = negative64(a64);

          // Assert
          expectValidArrayInt(result64);
          expect(toBigInt(result64)).toBe(expectedResult);
        }),
      );
    });
  });

  describe('add64', () => {
    it('should properly add two ArrayInt64 (including negative zeros)', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, b, na, nb) => {
            // Arrange
            const expectedResult = a + b;
            fc.pre(expectedResult >= -MaxArrayIntValue);
            fc.pre(expectedResult <= MaxArrayIntValue);
            const a64 = toArrayInt64(a, na);
            const b64 = toArrayInt64(b, nb);

            // Act
            const result64 = add64(a64, b64);

            // Assert
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(toBigInt(result64)).toBe(expectedResult);
          },
        ),
      );
    });

    it('should equal to first term if second one is zero', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, na, nb) => {
            // Arrange
            const a64 = toArrayInt64(a, na);
            const z64 = toArrayInt64(BigInt(0), nb);

            // Act
            const result64 = add64(a64, z64);

            // Assert
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(result64).toEqual(toArrayInt64(a, false)); // toArrayInt64(a, false): sign must be + for 0
          },
        ),
      );
    });

    it('should equal to second term if first one is zero', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, na, nb) => {
            // Arrange
            const z64 = toArrayInt64(BigInt(0), nb);
            const a64 = toArrayInt64(a, na);

            // Act
            const result64 = add64(z64, a64);

            // Assert
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(result64).toEqual(toArrayInt64(a, false)); // toArrayInt64(a, false): sign must be + for 0
          },
        ),
      );
    });

    it('should equal to zero when adding zeros together', () => {
      const negZero: ArrayInt64 = { sign: -1, data: [0, 0] };
      const posZero: ArrayInt64 = { sign: 1, data: [0, 0] };
      expect(add64(negZero, negZero)).toEqual(posZero);
      expect(add64(negZero, posZero)).toEqual(posZero);
      expect(add64(posZero, negZero)).toEqual(posZero);
      expect(add64(posZero, posZero)).toEqual(posZero);
    });
  });

  describe('halve64', () => {
    it('should properly halve an ArrayInt64 (including negative zeros)', () => {
      fc.assert(
        fc.property(fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }), fc.boolean(), (a, na) => {
          // Arrange
          const expectedResult = a / BigInt(2);
          const a64 = toArrayInt64(a, na);

          // Act
          const result64 = halve64(a64);

          // Assert
          expectValidArrayInt(result64);
          expect(toBigInt(result64)).toBe(expectedResult);
        }),
      );
    });
  });

  describe('logLike64', () => {
    it('should properly log2 an ArrayInt64', () => {
      fc.assert(
        fc.property(fc.bigInt({ min: BigInt(1), max: MaxArrayIntValue }), (a) => {
          // Arrange
          const expectedResult = Math.floor(Math.log(Number(a)) / Math.log(2));
          const a64 = toArrayInt64(a, false); // no negative zero: a > 0

          // Act
          const result64 = logLike64(a64);

          // Assert
          expectValidArrayInt(result64);
          expect(toBigInt(result64)).toBe(BigInt(expectedResult));
        }),
      );
    });

    it('should properly log2 a negative ArrayInt64', () => {
      fc.assert(
        fc.property(fc.bigInt({ min: BigInt(1), max: MaxArrayIntValue }), (a) => {
          // Arrange
          const expectedResult = -Math.floor(Math.log(Number(a)) / Math.log(2));
          const a64 = toArrayInt64(-a, false); // no negative zero: a > 0

          // Act
          const result64 = logLike64(a64);

          // Assert
          expectValidArrayInt(result64);
          expect(toBigInt(result64)).toBe(BigInt(expectedResult));
        }),
      );
    });
  });
});
