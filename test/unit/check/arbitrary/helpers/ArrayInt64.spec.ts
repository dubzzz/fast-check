import * as fc from '../../../../../lib/fast-check';

import {
  add64,
  ArrayInt64,
  halve64,
  isEqual64,
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
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  const MaxArrayIntValue = (BigInt(1) << BigInt(64)) - BigInt(1);

  describe('isEqual64', () => {
    it('Should consider identical values as equal', () =>
      fc.assert(
        fc.property(fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }), (a) => {
          expect(isEqual64(toArrayInt64(a, false), toArrayInt64(a, false))).toBe(true);
        })
      ));
    it('Should consider two different values as not equal', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, b, na, nb) => {
            fc.pre(a !== b);
            expect(isEqual64(toArrayInt64(a, na), toArrayInt64(b, nb))).toBe(false);
          }
        )
      ));
    it('Should consider zero and -zero to be equal', () => {
      expect(isEqual64({ sign: -1, data: [0, 0] }, { sign: -1, data: [0, 0] })).toBe(true);
      expect(isEqual64({ sign: 1, data: [0, 0] }, { sign: -1, data: [0, 0] })).toBe(true);
      expect(isEqual64({ sign: -1, data: [0, 0] }, { sign: 1, data: [0, 0] })).toBe(true);
      expect(isEqual64({ sign: 1, data: [0, 0] }, { sign: 1, data: [0, 0] })).toBe(true);
    });
  });

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
    it('Should consider zero and -zero as equal values (never strictly smaller that the other)', () => {
      expect(isStrictlySmaller64({ sign: -1, data: [0, 0] }, { sign: -1, data: [0, 0] })).toBe(false);
      expect(isStrictlySmaller64({ sign: 1, data: [0, 0] }, { sign: -1, data: [0, 0] })).toBe(false);
      expect(isStrictlySmaller64({ sign: -1, data: [0, 0] }, { sign: 1, data: [0, 0] })).toBe(false);
      expect(isStrictlySmaller64({ sign: 1, data: [0, 0] }, { sign: 1, data: [0, 0] })).toBe(false);
    });
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
            expectValidZeroIfAny(result64);
            expect(toBigInt(result64)).toBe(expectedResult);
          }
        )
      ));
    it('Should equal to first term if second one is zero', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, na, nb) => {
            const result64 = substract64(toArrayInt64(a, na), toArrayInt64(BigInt(0), nb));
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(result64).toEqual(toArrayInt64(a, false)); // toArrayInt64(a, false): sign must be + for 0
          }
        )
      ));
    it('Should equal to minus second term if first one is zero', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, na, nb) => {
            const result64 = substract64(toArrayInt64(BigInt(0), nb), toArrayInt64(a, na));
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(result64).toEqual(toArrayInt64(-a, false)); // toArrayInt64(-a, false): sign must be + for 0
          }
        )
      ));
    it('Should equal to zero when substracting zeros', () => {
      const negZero: ArrayInt64 = { sign: -1, data: [0, 0] };
      const posZero: ArrayInt64 = { sign: 1, data: [0, 0] };
      expect(substract64(negZero, negZero)).toEqual(posZero);
      expect(substract64(negZero, posZero)).toEqual(posZero);
      expect(substract64(posZero, negZero)).toEqual(posZero);
      expect(substract64(posZero, posZero)).toEqual(posZero);
    });
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
            expectValidZeroIfAny(result64);
            expect(toBigInt(result64)).toBe(expectedResult);
          }
        )
      ));
    it('Should equal to first term if second one is zero', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, na, nb) => {
            const result64 = add64(toArrayInt64(a, na), toArrayInt64(BigInt(0), nb));
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(result64).toEqual(toArrayInt64(a, false)); // toArrayInt64(a, false): sign must be + for 0
          }
        )
      ));
    it('Should equal to second term if first one is zero', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
          fc.boolean(),
          fc.boolean(),
          (a, na, nb) => {
            const result64 = add64(toArrayInt64(BigInt(0), nb), toArrayInt64(a, na));
            expectValidArrayInt(result64);
            expectValidZeroIfAny(result64);
            expect(result64).toEqual(toArrayInt64(a, false)); // toArrayInt64(a, false): sign must be + for 0
          }
        )
      ));
    it('Should equal to zero when adding zeros together', () => {
      const negZero: ArrayInt64 = { sign: -1, data: [0, 0] };
      const posZero: ArrayInt64 = { sign: 1, data: [0, 0] };
      expect(add64(negZero, negZero)).toEqual(posZero);
      expect(add64(negZero, posZero)).toEqual(posZero);
      expect(add64(posZero, negZero)).toEqual(posZero);
      expect(add64(posZero, posZero)).toEqual(posZero);
    });
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
