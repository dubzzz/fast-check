import * as assert from 'assert';
import * as prand from 'pure-rand';
import * as fc from '../../../../../lib/fast-check';

import Arbitrary from '../../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../../src/check/arbitrary/definition/Shrinkable';
import Random from '../../../../../src/random/generator/Random';

const testAlwaysGenerateCorrectValues = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  isValidValue: (g: T, seed: U) => boolean
) {
  it(`Should always generate correct values`, () =>
    fc.assert(
      fc.property(argsForArbGenerator, fc.integer().noShrink(), (params, seed) => {
        const arb = arbGenerator(params);
        let shrinkable = arb.generate(new Random(prand.mersenne(seed)));
        return isValidValue(shrinkable.value, params);
      })
    ));
};

const testAlwaysShrinkToCorrectValues = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  isValidValue: (g: T, seed: U) => boolean
) {
  it(`Should always shrink to correct values`, () =>
    fc.assert(
      fc.property(
        argsForArbGenerator,
        fc.integer().noShrink(),
        fc.set(fc.nat(100), 1, 10),
        (params, seed, shrinkPath) => {
          const arb = arbGenerator(params);
          let shrinkable: Shrinkable<T> | null = arb.generate(new Random(prand.mersenne(seed)));
          let id = 0;
          while (shrinkable !== null) {
            assert.ok(isValidValue(shrinkable.value, params), 'All values in the path must be correct');
            shrinkable = shrinkable.shrink().getNthOrLast(id);
            id = (id + 1) % shrinkPath.length;
          }
        }
      )
    ));
};

export const isValidArbitrary = function<U, T>(
  arbitraryBuilder: (u: U) => Arbitrary<T>,
  settings: {
    seedGenerator?: fc.Arbitrary<U>;
    isValidValue: (g: T, seed: U) => boolean;
  }
) {
  const seedGenerator = settings.seedGenerator || fc.constant(undefined);
  testAlwaysGenerateCorrectValues(seedGenerator, arbitraryBuilder, settings.isValidValue);
  testAlwaysShrinkToCorrectValues(seedGenerator, arbitraryBuilder, settings.isValidValue);
};

export const minMax = (arb: fc.Arbitrary<number>) =>
  fc.tuple(arb, arb).map(v => ({ min: Math.min(v[0], v[1]), max: Math.max(v[0], v[1]) }));
