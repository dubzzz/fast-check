import * as assert from 'power-assert';
import * as fc from '../../../../lib/fast-check';

import { RandomGenerator, skip_n, generate_n } from '../../../../src/random/generator/RandomGenerator';

const MAX_SIZE: number = 2048;

function sameSeedSameSequences(rng_for: (seed:number) => RandomGenerator) {
    return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
        const seq1 = generate_n(skip_n(rng_for(seed), offset), num)[0];
        const seq2 = generate_n(skip_n(rng_for(seed), offset), num)[0];
        assert.deepEqual(seq1, seq2);
    });
}

function sameSequencesIfCallTwice(rng_for: (seed:number) => RandomGenerator) {
    return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
        const rng = skip_n(rng_for(seed), offset);
        const seq1 = generate_n(rng, num)[0];
        const seq2 = generate_n(rng, num)[0];
        assert.deepEqual(seq1, seq2);
    });
}

function valuesInRange(rng_for: (seed:number) => RandomGenerator) {
    return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
        const rng = rng_for(seed);
        const value = skip_n(rng, offset).next()[0];
        assert.ok(value >= rng.min());
        assert.ok(value <= rng.max());
    });
}

export {sameSeedSameSequences, sameSequencesIfCallTwice, valuesInRange};
