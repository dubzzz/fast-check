import * as assert from 'power-assert';
import { RandomGenerator, skip_n, generate_n } from '../../../src/random/generator/RandomGenerator';
import MersenneTwister from '../../../src/random/generator/MersenneTwister';
import * as jsc from 'jsverify';

function rng_for(seed: number) {
    return MersenneTwister.from(seed);
}

const MAX_SIZE: number = 2048;
describe("MersenneTwister", () => {
    it("Should return the same sequence given same seeds", () => {
        return jsc.assert(jsc.forall(jsc.integer, jsc.nat(MAX_SIZE), jsc.nat(MAX_SIZE), (seed, offset, num) => {
            const seq1 = generate_n(skip_n(rng_for(seed), offset), num)[0];
            const seq2 = generate_n(skip_n(rng_for(seed), offset), num)[0];
            assert.deepEqual(seq1, seq2);
            return true;
        }));
    });
    it("Should return the same sequence if called twice", () => {
        return jsc.assert(jsc.forall(jsc.integer, jsc.nat(MAX_SIZE), jsc.nat(MAX_SIZE), (seed, offset, num) => {
            const rng = skip_n(rng_for(seed), offset);
            const seq1 = generate_n(rng, num)[0];
            const seq2 = generate_n(rng, num)[0];
            assert.deepEqual(seq1, seq2);
            return true;
        }));
    });
    it("Should generate values between -2**31 and 2**31 -1", () => {
        return jsc.assert(jsc.forall(jsc.integer, jsc.nat(MAX_SIZE), (seed, offset) => {
            const value = skip_n(rng_for(seed), offset).next()[0];
            assert.ok(value >= MersenneTwister.min);
            assert.ok(value <= MersenneTwister.max);
            return true;
        }));
    });
});
