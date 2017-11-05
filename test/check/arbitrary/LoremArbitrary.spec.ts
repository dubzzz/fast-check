import * as assert from 'power-assert';
import MersenneTwister from '../../../src/random/generator/MersenneTwister';
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import { lorem } from '../../../src/check/arbitrary/LoremArbitrary';
import * as jsc from 'jsverify';

describe('LoremArbitrary', () => {
    describe('lorem', () => {
        it('Should generate the same text with the same random', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng1 = new MutableRandomGenerator(MersenneTwister.from(seed));
                const mrng2 = new MutableRandomGenerator(MersenneTwister.from(seed));
                const g1 = lorem().generate(mrng1);
                const g2 = lorem().generate(mrng2);
                assert.equal(g1, g2);
                return true;
            })
        ));
        it('Should generate words by default', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer(0, 100), (seed, num) => {
                const mrng = new MutableRandomGenerator(MersenneTwister.from(seed));
                const g = lorem(num).generate(mrng);
                return g.indexOf('.') === -1;
            })
        ));
        it('Should generate sentences when asked too', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(MersenneTwister.from(seed));
                const g = lorem(5, true).generate(mrng);
                return g.indexOf('.') !== -1;
            })
        ));
    });
});
