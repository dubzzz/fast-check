import * as fc from '../../../../lib/fast-check';

import { doubleNext, DoubleNextConstraints } from '../../../../src/check/arbitrary/DoubleNextArbitrary';
import * as genericHelper from './generic/GenericArbitraryHelper';

const float64raw = () => {
  return fc
    .tuple(fc.integer(), fc.integer())
    .map(([na32, nb32]) => new Float64Array(new Int32Array([na32, nb32]).buffer)[0]);
};
const doubleNextConstraints = () => {
  return fc
    .record(
      { min: float64raw(), max: float64raw(), noDefaultInfinity: fc.boolean(), noNaN: fc.boolean() },
      { withDeletedKeys: true }
    )
    .filter((ct) => (ct.min === undefined || !Number.isNaN(ct.min)) && (ct.max === undefined || !Number.isNaN(ct.max)))
    .filter((ct) => {
      if (!ct.noDefaultInfinity) return true;
      if (ct.min === Number.POSITIVE_INFINITY && ct.max === undefined) return false;
      if (ct.min === undefined && ct.max === Number.NEGATIVE_INFINITY) return false;
      return true;
    })
    .map((ct) => {
      if (ct.min === undefined || ct.max === undefined) return ct;
      const { min, max } = ct;
      if (min < max) return ct;
      if (min === max && (min !== 0 || 1 / min <= 1 / max)) return ct;
      return { ...ct, min: max, max: min };
    });
};

describe('DoubleNextArbitrary', () => {
  describe('doubleNext', () => {
    describe('Is valid arbitrary?', () => {
      genericHelper.isValidArbitrary((ct?: DoubleNextConstraints) => doubleNext(ct), {
        isStrictlySmallerValue: (fa, fb) =>
          Math.abs(fa) < Math.abs(fb) || //              Case 1: abs(a) < abs(b)
          (Object.is(fa, +0) && Object.is(fb, -0)) || // Case 2: +0 < -0  --> we shrink from -0 to +0
          (!Number.isNaN(fa) && Number.isNaN(fb)), //    Case 3: notNaN < NaN, NaN is one of the extreme values
        isValidValue: (g: number, ct?: DoubleNextConstraints) => {
          if (typeof g !== 'number') return false; // should always produce numbers
          if (Number.isNaN(g)) {
            if (ct !== undefined && ct.noNaN) return false; // should not produce NaN if explicitely asked not too
            return true;
          }
          if (ct !== undefined && ct.min !== undefined && g < ct.min) return false; // should always be greater than min when specified
          if (ct !== undefined && ct.max !== undefined && g > ct.max) return false; // should always be smaller than max when specified
          if (ct !== undefined && ct.noDefaultInfinity) {
            if (ct.min === undefined && g === Number.NEGATIVE_INFINITY) return false; // should not produce -infinity when noInfity and min unset
            if (ct.max === undefined && g === Number.POSITIVE_INFINITY) return false; // should not produce +infinity when noInfity and max unset
          }
          return true;
        },
        seedGenerator: fc.option(doubleNextConstraints(), { nil: undefined }),
      });
    });
  });
});
