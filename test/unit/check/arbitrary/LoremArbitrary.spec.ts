import * as assert from 'power-assert';
import * as fc from '../../../../lib/fast-check';

import { lorem } from '../../../../src/check/arbitrary/LoremArbitrary';
import MersenneTwister from '../../../../src/random/generator/MersenneTwister';
import MutableRandomGenerator from '../../../../src/random/generator/MutableRandomGenerator';

describe('LoremArbitrary', () => {
    describe('lorem', () => {
        it('Should generate the same text with the same random', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng1 = new MutableRandomGenerator(MersenneTwister.from(seed));
                const mrng2 = new MutableRandomGenerator(MersenneTwister.from(seed));
                const g1 = lorem().generate(mrng1).value;
                const g2 = lorem().generate(mrng2).value;
                assert.equal(g1, g2);
                return true;
            })
        ));
        it('Should generate words by default', () => fc.assert(
            fc.property(fc.integer(), fc.integer(0, 100), (seed, num) => {
                const mrng = new MutableRandomGenerator(MersenneTwister.from(seed));
                const g = lorem(num).generate(mrng).value;
                return g.indexOf('.') === -1;
            })
        ));
        it('Should generate sentences when asked too', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = new MutableRandomGenerator(MersenneTwister.from(seed));
                const g = lorem(5, true).generate(mrng).value;
                return g.indexOf('.') !== -1;
            })
        ));
    });
});
