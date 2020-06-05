import { nat } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { stringOf } from '../../../../src/check/arbitrary/StringArbitrary';
import { mixedCase } from '../../../../src/check/arbitrary/MixedCaseArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

declare function BigInt(n: number | bigint | string): bigint;

describe('MixedCaseArbitrary', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }
  describe('mixedCase', () => {
    const stringArb = stringOf(nat(3).map((id) => ['0', '1', 'A', 'B'][id]));
    genericHelper.isValidArbitrary(() => mixedCase(stringArb), {
      isStrictlySmallerValue: (v1, v2) => {
        return v1.length < v2.length || v1 < v2 /* '0' < 'A' < 'a' */;
      },
      isValidValue: (g: string) => typeof g === 'string' && [...g].every((c) => '01abAB'.includes(c)),
    });
  });
});
