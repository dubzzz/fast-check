import * as assert from 'assert';
import prand from 'pure-rand';
import fc from '../../../../../lib/fast-check';

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
        assert.deepStrictEqual(shrinkableMutation.value, shrinkableNoMutation.value);

        mutate(shrinkableMutation.value);
        assert.deepStrictEqual(
          [...shrinkableMutation.shrink().map(s => s.value)],
          [...shrinkableNoMutation.shrink().map(s => s.value)]
        );
      })
    ));
};

export const testNoImpactOfMutation = function<T>(arb: Arbitrary<T>, mutate: (t: T) => void) {
  testNoImpactOfMutationOnGenerated(arb, mutate);
  testNoImpactOfMutationOnShrunk(arb, mutate);
};
