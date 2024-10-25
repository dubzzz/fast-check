import { describe, it, expect } from 'vitest';
import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

declare function BigInt(n: number | bigint | string): bigint;

function bigInt1030() {
  const n = 1030;
  const min = BigInt(-1) << BigInt(n - 1);
  const max = (BigInt(1) << BigInt(n - 1)) - BigInt(1);
  return fc.bigInt({ min, max });
}

describe(`BigIntArbitrary (seed: ${seed})`, () => {
  describe('bitIntN', () => {
    it('Should be able to generate bigint above the highest positive double', () => {
      const out = fc.check(
        fc.property(bigInt1030(), (v) => Number(v) !== Number.POSITIVE_INFINITY),
        { seed: seed },
      );
      expect(out.failed).toBe(true);

      const bInt = out.counterexample![0];
      expect(Number(bInt)).toBe(Number.POSITIVE_INFINITY);
      expect(Number(bInt - BigInt(1))).not.toBe(Number.POSITIVE_INFINITY);
    });
    it('Should be able to generate bigint below the smallest negative double', () => {
      const out = fc.check(
        fc.property(bigInt1030(), (v) => Number(v) !== Number.NEGATIVE_INFINITY),
        { seed: seed },
      );
      expect(out.failed).toBe(true);

      const bInt = out.counterexample![0];
      expect(Number(bInt)).toBe(Number.NEGATIVE_INFINITY);
      expect(Number(bInt + BigInt(1))).not.toBe(Number.NEGATIVE_INFINITY);
    });
    it('Should be able to generate small bigint (relatively to maximal bigint asked)', () => {
      const out = fc.check(
        fc.property(bigInt1030(), (v) => Number(v) < Number.MIN_SAFE_INTEGER || Number(v) > Number.MAX_SAFE_INTEGER),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0]).toEqual(BigInt(0));
      // Remark: Values, v, satisfying: v >= Number.MIN_SAFE_INTEGER && v <= Number.MAX_SAFE_INTEGER are pretty improbable in theory
      //         as they have only ~2**54 chances over 2**1030 to be generated (around 2e-292 % of the generated values).
      //         With bias enabled (default), they could be generated more often than expected leading to a better
      //         discovery of close to zero issues.
    });
    it('Should be able to generate close to min or max bigints (relatively to the asked range)', () => {
      const out = fc.check(
        fc.property(
          bigInt1030(),
          (v) =>
            v >= (BigInt(-1) << BigInt(1030 - 1)) + BigInt(500) && v <= (BigInt(1) << BigInt(1030 - 1)) - BigInt(500),
        ),
        { seed: seed },
      );
      expect(out.failed).toBe(true); // It found something quite close to min/max
      // Remark: Values, v, satisfying: v < min - 500n || v > max + 500n are pretty improbable in theory
      //         as they have only 1000 chances over 2**1030 to be generated (around 8e-310 % of the generated values).
      //         With bias enabled (default), they could be generated more often than expected leading to a better
      //         discovery of boundaries issues.
    });
    it('Should not be able to generate small bigint if not biased (very improbable)', () => {
      const out = fc.check(
        fc.property(
          fc.noBias(bigInt1030()),
          (v) => Number(v) < Number.MIN_SAFE_INTEGER || Number(v) > Number.MAX_SAFE_INTEGER,
        ),
        { seed: seed },
      );
      expect(out.failed).toBe(false);
    });
    it('Should not be able to generate close to min or max bigints if not biased (very improbable)', () => {
      const out = fc.check(
        fc.property(
          fc.noBias(bigInt1030()),
          (v) =>
            v >= (BigInt(-1) << BigInt(1030 - 1)) + BigInt(500) && v <= (BigInt(1) << BigInt(1030 - 1)) - BigInt(500),
        ),
        { seed: seed },
      );
      expect(out.failed).toBe(false);
    });
  });
});
