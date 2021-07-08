import * as fc from '../../../../lib/fast-check';

import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Random } from '../../../../src/random/generator/Random';
import { double } from '../../../../src/arbitrary/double';
import { float } from '../../../../src/arbitrary/float';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';
import { generateOneValue } from './generic/GenerateOneValue';

const MAX_TRIES = 100;
describe('FloatingPointArbitrary', () => {
  const canShrinkWithoutContextFloatingPoint = (mrng: Random, arb: Arbitrary<number>) => {
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
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          return canShrinkWithoutContextFloatingPoint(mrng, float());
        })
      ));
    describe('Given no constraints [between 0 (included) and 1 (excluded)]', () => {
      genericHelper.isValidArbitrary(() => float(), {
        isStrictlySmallerValue: (a, b) => a < b,
        isValidValue: (g: number) => typeof g === 'number' && 0.0 <= g && g < 1.0,
      });
    });
    describe('Given minimal value only [between min (included) and 1 (excluded)]', () => {
      genericHelper.isValidArbitrary((min: number) => float({ min }), {
        seedGenerator: fc.integer(-0x7fffffff, 99).map((v) => v / 100.0), // must be <1
        isValidValue: (g: number, min: number) => typeof g === 'number' && min <= g && g < 1,
      });
    });
    describe('Given maximal value only [between 0 (included) and max (excluded)]', () => {
      genericHelper.isValidArbitrary((max: number) => float({ max }), {
        seedGenerator: fc.nat().map((v) => (v + 1) / 100.0), // must be >0
        isStrictlySmallerValue: (a, b) => a < b,
        isValidValue: (g: number, max: number) => typeof g === 'number' && 0.0 <= g && g < max,
      });
    });
    describe('Given minimal and maximal values [between min (included) and max (excluded)]', () => {
      genericHelper.isValidArbitrary((constraints: { min: number; max: number }) => float(constraints), {
        seedGenerator: genericHelper
          .minMax(fc.integer())
          .filter(({ min, max }: { min: number; max: number }) => min !== max)
          .map(({ min, max }: { min: number; max: number }) => ({ min: min / 100.0, max: max / 100.0 })),
        isValidValue: (g: number, constraints: { min: number; max: number }) =>
          typeof g === 'number' && constraints.min <= g && g < constraints.max,
      });
    });
    describe('Still support older signatures', () => {
      it('Should support fc.float(max)', () => {
        fc.assert(
          fc.property(
            fc.integer(),
            fc.nat().map((v) => (v + 1) / 100.0),
            (seed, max) => {
              const refArbitrary = float({ max });
              const otherArbitrary = float(max);
              expect(generateOneValue(seed, otherArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
            }
          )
        );
      });
      it('Should support fc.float(min, max)', () => {
        fc.assert(
          fc.property(
            fc.integer(),
            genericHelper
              .minMax(fc.integer())
              .filter(({ min, max }: { min: number; max: number }) => min !== max)
              .map(({ min, max }: { min: number; max: number }) => ({ min: min / 100.0, max: max / 100.0 })),
            (seed, constraints) => {
              const refArbitrary = float(constraints);
              const otherArbitrary = float(constraints.min, constraints.max);
              expect(generateOneValue(seed, otherArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
            }
          )
        );
      });
    });
  });
  describe('double', () => {
    it('Should be able to generate a floating point number value', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          return canShrinkWithoutContextFloatingPoint(mrng, double());
        })
      ));
    describe('Given no constraints [between 0 (included) and 1 (excluded)]', () => {
      genericHelper.isValidArbitrary(() => double(), {
        isStrictlySmallerValue: (a, b) => a < b,
        isValidValue: (g: number) => typeof g === 'number' && 0.0 <= g && g < 1.0,
      });
    });
    describe('Given minimal value only [between min (included) and 1 (excluded)]', () => {
      genericHelper.isValidArbitrary((min: number) => double({ min }), {
        seedGenerator: fc.integer(-0x7fffffff, 99).map((v) => v / 100.0), // must be <1
        isValidValue: (g: number, min: number) => typeof g === 'number' && min <= g && g < 1,
      });
    });
    describe('Given maximal value only [between 0 (included) and max (excluded)]', () => {
      genericHelper.isValidArbitrary((max: number) => double({ max }), {
        seedGenerator: fc.nat().map((v) => (v + 1) / 100.0), // must be >0
        isStrictlySmallerValue: (a, b) => a < b,
        isValidValue: (g: number, max: number) => typeof g === 'number' && 0.0 <= g && g < max,
      });
    });
    describe('Given minimal and maximal values [between min (included) and max (excluded)]', () => {
      genericHelper.isValidArbitrary((constraints: { min: number; max: number }) => double(constraints), {
        seedGenerator: genericHelper
          .minMax(fc.integer())
          .filter(({ min, max }: { min: number; max: number }) => min !== max)
          .map(({ min, max }: { min: number; max: number }) => ({ min: min / 100.0, max: max / 100.0 })),
        isValidValue: (g: number, constraints: { min: number; max: number }) =>
          typeof g === 'number' && constraints.min <= g && g < constraints.max,
      });
    });
    describe('Still support older signatures', () => {
      it('Should support fc.double(max)', () => {
        fc.assert(
          fc.property(
            fc.integer(),
            fc.nat().map((v) => (v + 1) / 100.0),
            (seed, max) => {
              const refArbitrary = double({ max });
              const otherArbitrary = double(max);
              expect(generateOneValue(seed, otherArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
            }
          )
        );
      });
      it('Should support fc.double(min, max)', () => {
        fc.assert(
          fc.property(
            fc.integer(),
            genericHelper
              .minMax(fc.integer())
              .filter(({ min, max }: { min: number; max: number }) => min !== max)
              .map(({ min, max }: { min: number; max: number }) => ({ min: min / 100.0, max: max / 100.0 })),
            (seed, constraints) => {
              const refArbitrary = double(constraints);
              const otherArbitrary = double(constraints.min, constraints.max);
              expect(generateOneValue(seed, otherArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
            }
          )
        );
      });
    });
  });
});
