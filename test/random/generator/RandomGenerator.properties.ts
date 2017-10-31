import * as assert from 'power-assert';
import { RandomGenerator, skip_n, generate_n } from '../../../src/random/generator/RandomGenerator';
import * as jsc from 'jsverify';

const MAX_SIZE: number = 2048;

function sameSeedSameSequences(rng_for: (seed:number) => RandomGenerator) {
    return jsc.forall(jsc.integer, jsc.nat(MAX_SIZE), jsc.nat(MAX_SIZE), (seed, offset, num) => {
        const seq1 = generate_n(skip_n(rng_for(seed), offset), num)[0];
        const seq2 = generate_n(skip_n(rng_for(seed), offset), num)[0];
        assert.deepEqual(seq1, seq2);
        return true;
    });
}

function sameSequencesIfCallTwice(rng_for: (seed:number) => RandomGenerator) {
    return jsc.forall(jsc.integer, jsc.nat(MAX_SIZE), jsc.nat(MAX_SIZE), (seed, offset, num) => {
        const rng = skip_n(rng_for(seed), offset);
        const seq1 = generate_n(rng, num)[0];
        const seq2 = generate_n(rng, num)[0];
        assert.deepEqual(seq1, seq2);
        return true;
    });
}

function valuesInRange(rng_for: (seed:number) => RandomGenerator) {
    return jsc.forall(jsc.integer, jsc.nat(MAX_SIZE), (seed, offset) => {
        const rng = rng_for(seed);
        const value = skip_n(rng, offset).next()[0];
        assert.ok(value >= rng.min());
        assert.ok(value <= rng.max());
        return true;
    });
}

export {sameSeedSameSequences, sameSequencesIfCallTwice, valuesInRange};
