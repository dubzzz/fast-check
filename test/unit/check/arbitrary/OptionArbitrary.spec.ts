import * as assert from 'power-assert';
import prand from 'pure-rand';
import fc from '../../../../lib/fast-check';

import { option } from '../../../../src/check/arbitrary/OptionArbitrary';
import Random from '../../../../src/random/generator/Random';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

describe("OptionArbitrary", () => {
    describe('option', () => {
        it('Should produce null option on default freq value', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const MAX_GUESSES = 1000;
                const mrng = new Random(prand.mersenne(seed));
                const arb = option(stubArb.forward());
                for (let idx = 0 ; idx != MAX_GUESSES ; ++idx) {
                    if (arb.generate(mrng).value == null) {
                        return true;
                    }
                }
                return false;
            })
        ));
        it('Should shrink towards null', () => fc.assert(
            fc.property(fc.integer(), fc.integer(), (seed, start) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                let shrinkable = option(stubArb.withShrink(start)).generate(mrng);
                while (shrinkable.shrink().has(v => true)[0]) {
                    shrinkable = shrinkable.shrink().next().value;
                }// only check one shrink path
                return shrinkable.value === null;
            })
        ));
    });
});
