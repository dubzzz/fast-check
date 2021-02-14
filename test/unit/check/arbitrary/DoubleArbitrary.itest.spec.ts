import * as fc from '../../../../lib/fast-check';

import { double, DoubleConstraints } from '../../../../src/check/arbitrary/DoubleArbitrary';
import { doubleConstraints } from './generic/FloatingPointHelpers';
import * as genericHelper from './generic/GenericArbitraryHelper';

describe('DoubleArbitrary', () => {
  describe('double', () => {
    describe('Is valid arbitrary?', () => {
      genericHelper.isValidArbitrary((ct?: DoubleConstraints) => double(ct), {
        isStrictlySmallerValue: (fa, fb) =>
          Math.abs(fa) < Math.abs(fb) || //              Case 1: abs(a) < abs(b)
          (Object.is(fa, +0) && Object.is(fb, -0)) || // Case 2: +0 < -0  --> we shrink from -0 to +0
          (!Number.isNaN(fa) && Number.isNaN(fb)), //    Case 3: notNaN < NaN, NaN is one of the extreme values
        isValidValue: (g: number, ct?: DoubleConstraints) => {
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
        seedGenerator: fc.option(doubleConstraints(), { nil: undefined }),
      });
    });
  });
});
