import * as fc from '../../../../../lib/fast-check';

import {
  add64,
  ArrayInt64,
  halve64,
  isStrictlySmaller64,
  logLike64,
  negative64,
  substract64,
} from '../../../../../src/check/arbitrary/helpers/ArrayInt64';

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

function expectValidArrayInt(a: ArrayInt64): boolean {
  return (
    (a.sign === 1 || a.sign === -1) &&
    a.data[0] >= 0 &&
    a.data[0] <= 0xffffffff &&
    a.data[1] >= 0 &&
    a.data[1] <= 0xffffffff
  );
}

describe('ArrayInt64', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  const MaxArrayIntValue = (BigInt(1) << BigInt(64)) - BigInt(1);

  describe('isStrictlySmaller64', () => {
    it('Should properly compare two ArrayInt64 (including negative zeros)', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, b, na, nb) => {
            expect(isStrictlySmaller64(toArrayInt64(a, na), toArrayInt64(b, nb))).toBe(a < b);
          }
        )
      ));
  });

  describe('substract64', () => {
    it('Should properly substract two ArrayInt64 (including negative zeros)', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, b, na, nb) => {
            const expectedResult = a - b;
            fc.pre(expectedResult >= -MaxArrayIntValue);
            fc.pre(expectedResult <= MaxArrayIntValue);
            const result64 = substract64(toArrayInt64(a, na), toArrayInt64(b, nb));
            expectValidArrayInt(result64);
            expect(toBigInt(result64)).toBe(expectedResult);
          }
        )
      ));
  });

  describe('negative64', () => {
    it('Should properly negate an ArrayInt64 (including negative zeros)', () =>
      fc.assert(
        fc.property(fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }), fc.boolean(), (a, na) => {
          const expectedResult = -a;
          const result64 = negative64(toArrayInt64(a, na));
          expectValidArrayInt(result64);
          expect(toBigInt(result64)).toBe(expectedResult);
        })
      ));
  });

  describe('add64', () => {
    it('Should properly add two ArrayInt64 (including negative zeros)', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, b, na, nb) => {
            const expectedResult = a + b;
            fc.pre(expectedResult >= -MaxArrayIntValue);
            fc.pre(expectedResult <= MaxArrayIntValue);
            const result64 = add64(toArrayInt64(a, na), toArrayInt64(b, nb));
            expectValidArrayInt(result64);
            expect(toBigInt(result64)).toBe(expectedResult);
          }
        )
      ));
  });

  describe('halve64', () => {
    it('Should properly halve an ArrayInt64 (including negative zeros)', () =>
      fc.assert(
        fc.property(fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }), fc.boolean(), (a, na) => {
          const expectedResult = a / BigInt(2);
          const result64 = halve64(toArrayInt64(a, na));
          expectValidArrayInt(result64);
          expect(toBigInt(result64)).toBe(expectedResult);
        })
      ));
  });

  describe('logLike64', () => {
    it('Should properly log2 an ArrayInt64', () =>
      fc.assert(
        fc.property(fc.bigInt({ min: BigInt(1), max: MaxArrayIntValue }), (a) => {
          const expectedResult = Math.floor(Math.log(Number(a)) / Math.log(2));
          const result64 = logLike64(toArrayInt64(a, false)); // no negative zero: a > 0
          expectValidArrayInt(result64);
          expect(toBigInt(result64)).toBe(BigInt(expectedResult));
        })
      ));

    it('Should properly log2 a negative ArrayInt64', () =>
      fc.assert(
        fc.property(fc.bigInt({ min: BigInt(1), max: MaxArrayIntValue }), (a) => {
          const expectedResult = -Math.floor(Math.log(Number(a)) / Math.log(2));
          const result64 = logLike64(toArrayInt64(-a, false)); // no negative zero: a > 0
          expectValidArrayInt(result64);
          expect(toBigInt(result64)).toBe(BigInt(expectedResult));
        })
      ));
  });
});
