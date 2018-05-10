import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Random from '../../../../src/random/generator/Random';
import { float, double } from '../../../../src/check/arbitrary/FloatingPointArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';

const MAX_TRIES = 100;
describe('FloatingPointArbitrary', () => {
  const canGenerateFloatingPoint = (mrng: Random, arb: Arbitrary<number>) => {
    for (let idx = 0; idx != MAX_TRIES; ++idx) {
      const g = arb.generate(mrng).value;
      if (g != Math.round(g)) {
        return true;
      }
    }
    return false;
  };

  describe('float', () => {
    it('Should be able to generate a floating point number value', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          return canGenerateFloatingPoint(mrng, float());
        })
      ));
    describe('Given no constraints [between 0 (included) and 1 (excluded)]', () => {
      genericHelper.isValidArbitrary(() => float(), {
        isStrictlySmallerValue: (a, b) => a < b,
        isValidValue: (g: number) => typeof g === 'number' && 0.0 <= g && g < 1.0
      });
    });
    describe('Given maximal value only [between 0 (included) and max (excluded)]', () => {
      genericHelper.isValidArbitrary((maxValue: number) => float(maxValue), {
        seedGenerator: fc.nat().map(v => (v + 1) / 100.0), // must be != 0
        isStrictlySmallerValue: (a, b) => a < b,
        isValidValue: (g: number, maxValue: number) => typeof g === 'number' && 0.0 <= g && g < maxValue
      });
    });
    describe('Given minimal and maximal values [between min (included) and max (excluded)]', () => {
      genericHelper.isValidArbitrary(
        (constraints: { min: number; max: number }) => float(constraints.min, constraints.max),
        {
          seedGenerator: genericHelper
            .minMax(fc.integer())
            .filter(({ min, max }: { min: number; max: number }) => min !== max)
            .map(({ min, max }: { min: number; max: number }) => ({ min: min / 100.0, max: max / 100.0 })),
          isValidValue: (g: number, constraints: { min: number; max: number }) =>
            typeof g === 'number' && constraints.min <= g && g < constraints.max
        }
      );
    });
  });
  describe('double', () => {
    it('Should be able to generate a floating point number value', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          return canGenerateFloatingPoint(mrng, double());
        })
      ));
    describe('Given no constraints [between 0 (included) and 1 (excluded)]', () => {
      genericHelper.isValidArbitrary(() => double(), {
        isStrictlySmallerValue: (a, b) => a < b,
        isValidValue: (g: number) => typeof g === 'number' && 0.0 <= g && g < 1.0
      });
    });
    describe('Given maximal value only [between 0 (included) and max (excluded)]', () => {
      genericHelper.isValidArbitrary((maxValue: number) => double(maxValue), {
        seedGenerator: fc.nat().map(v => (v + 1) / 100.0), // must be != 0
        isStrictlySmallerValue: (a, b) => a < b,
        isValidValue: (g: number, maxValue: number) => typeof g === 'number' && 0.0 <= g && g < maxValue
      });
    });
    describe('Given minimal and maximal values [between min (included) and max (excluded)]', () => {
      genericHelper.isValidArbitrary(
        (constraints: { min: number; max: number }) => double(constraints.min, constraints.max),
        {
          seedGenerator: genericHelper
            .minMax(fc.integer())
            .filter(({ min, max }: { min: number; max: number }) => min !== max)
            .map(({ min, max }: { min: number; max: number }) => ({ min: min / 100.0, max: max / 100.0 })),
          isValidValue: (g: number, constraints: { min: number; max: number }) =>
            typeof g === 'number' && constraints.min <= g && g < constraints.max
        }
      );
    });
  });
});
