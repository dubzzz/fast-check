import * as fc from '../../../../../lib/fast-check';

import { ArrayInt64 } from '../../../../../src/check/arbitrary/helpers/ArrayInt64';
import { arrayInt64 } from '../../../../../src/check/arbitrary/helpers/ArrayInt64Arbitrary';
import * as genericHelper from '../generic/GenericArbitraryHelper';

function toArrayInt64(b: bigint): ArrayInt64 {
  const posB = b < BigInt(0) ? -b : b;
  return {
    sign: b < BigInt(0) ? -1 : 1,
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

  describe('arrayInt64', () => {
    describe('Given minimal and maximal values [between min and max]', () => {
      genericHelper.isValidArbitrary(
        (constraints: { min: bigint; max: bigint }) =>
          arrayInt64(toArrayInt64(constraints.min), toArrayInt64(constraints.max)),
        {
          seedGenerator: fc
            .tuple(
              fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
              fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue })
            )
            .map((vs) => ({
              min: vs[0] <= vs[1] ? vs[0] : vs[1],
              max: vs[0] <= vs[1] ? vs[1] : vs[0],
            })),
          isStrictlySmallerValue: (g1: ArrayInt64, g2: ArrayInt64) => {
            const v1 = toBigInt(g1);
            const v2 = toBigInt(g2);
            const absV1 = v1 < BigInt(0) ? -v1 : v1;
            const absV2 = v2 < BigInt(0) ? -v2 : v2;
            return absV1 < absV2;
          },
          isValidValue: (g: ArrayInt64, constraints: { min: bigint; max: bigint }) => {
            if (!expectValidArrayInt(g)) {
              return false;
            }
            const v = toBigInt(g);
            if (v === BigInt(0) && g.sign === -1) {
              return false; // zero is always supposed to be marked with sign 1
            }
            return constraints.min <= v && v <= constraints.max;
          },
        }
      );
    });
  });
});
