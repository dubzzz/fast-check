import * as assert from 'assert';
import * as prand from 'pure-rand';
import * as fc from '../../../../../lib/fast-check';

import Arbitrary from '../../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../../src/check/arbitrary/definition/Shrinkable';
import Random from '../../../../../src/random/generator/Random';

// Assess that applying a mutation on the generated value
// does not impact the way the Arbitrary will shrink
const testNoImpactOfMutationOnGenerated = function<T>(arb: Arbitrary<T>, mutate: (t: T) => void) {
  it('Should not be impacted by mutations of its generated value', () =>
    fc.assert(
      fc.property(fc.integer(), seed => {
        const shrinkableNoMutation = arb.generate(new Random(prand.mersenne(seed)));
        const shrinkableMutation = arb.generate(new Random(prand.mersenne(seed)));
        assert.deepStrictEqual(shrinkableMutation.value, shrinkableNoMutation.value);

        mutate(shrinkableMutation.value);
        assert.deepStrictEqual(
          [...shrinkableMutation.shrink().map(s => s.value)],
          [...shrinkableNoMutation.shrink().map(s => s.value)]
        );
      })
    ));
};

// Assess that applying a mutation on on of the shrunk values
// does not impact the way the Arbitrary will shrink next ones
const testNoImpactOfMutationOnShrunk = function<T>(arb: Arbitrary<T>, mutate: (t: T) => void) {
  it('Should not be impacted by mutations of its shrunk value', () =>
    fc.assert(
      fc.property(fc.integer(), fc.nat(100), (seed, idxShrunk) => {
        const shrinkable = arb.generate(new Random(prand.mersenne(seed)));

        const shrinkableNoMutation = shrinkable.shrink().getNthOrLast(idxShrunk);
        const shrinkableMutation = shrinkable.shrink().getNthOrLast(idxShrunk);
        if (shrinkableNoMutation == null) {
          return true; // no shrink for this generated value
        }
        assert.deepStrictEqual(shrinkableMutation!.value, shrinkableNoMutation.value);

        mutate(shrinkableMutation!.value);
        assert.deepStrictEqual(
          [...shrinkableMutation!.shrink().map(s => s.value)],
          [...shrinkableNoMutation.shrink().map(s => s.value)]
        );
      })
    ));
};

export const testNoImpactOfMutation = function<T>(arb: Arbitrary<T>, mutate: (t: T) => void) {
  testNoImpactOfMutationOnGenerated(arb, mutate);
  testNoImpactOfMutationOnShrunk(arb, mutate);
};

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
          const initial = shrinkable.value;
          const allLengths: number[] = [];
          let id = 0;
          let tot = 0;
          while (shrinkable !== null) {
            if (Array.isArray(shrinkable.value)) allLengths.push(((shrinkable.value as any) as any[]).length);
            assert.ok(isCorrect(params, shrinkable.value), 'All values in the path must be correct');
            shrinkable = shrinkable.shrink().getNthOrLast(id);
            id = (id + 1) % shrinkPath.length;
            ++tot;
            if (tot === 100) {
              console.log(JSON.stringify({ params, initial, seed, shrinkPath, allLengths }));
            }
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
