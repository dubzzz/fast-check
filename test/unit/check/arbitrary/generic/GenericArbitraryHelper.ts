import * as assert from 'assert';
import * as prand from 'pure-rand';
import * as fc from '../../../../../lib/fast-check';

import Arbitrary from '../../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../../src/check/arbitrary/definition/Shrinkable';
import Random from '../../../../../src/random/generator/Random';

const testAlwaysGenerateCorrectValues = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  isCorrect: (u: U, t: T) => boolean,
  label?: string
) {
  it(`Should always generate correct values${label ? ': ' + label : ''}`, () =>
    fc.assert(
      fc.property(argsForArbGenerator, fc.integer().noShrink(), (params, seed) => {
        const arb = arbGenerator(params);
        let shrinkable = arb.generate(new Random(prand.mersenne(seed)));
        return isCorrect(params, shrinkable.value);
      })
    ));
};

const testAlwaysShrinkToCorrectValues = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  isCorrect: (u: U, t: T) => boolean,
  label?: string
) {
  it(`Should always shrink to correct values${label ? ': ' + label : ''}`, () =>
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
            assert.ok(isCorrect(params, shrinkable.value), 'All values in the path must be correct');
            shrinkable = shrinkable.shrink().getNthOrLast(id);
            id = (id + 1) % shrinkPath.length;
          }
        }
      )
    ));
};

export const testAlwaysCorrectValues = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  isCorrect: (u: U, t: T) => boolean,
  label?: string
) {
  testAlwaysGenerateCorrectValues(argsForArbGenerator, arbGenerator, isCorrect, label);
  testAlwaysShrinkToCorrectValues(argsForArbGenerator, arbGenerator, isCorrect, label);
};

export const minMax = (arb: fc.Arbitrary<number>) =>
  fc.tuple(arb, arb).map(v => ({ min: Math.min(v[0], v[1]), max: Math.max(v[0], v[1]) }));
