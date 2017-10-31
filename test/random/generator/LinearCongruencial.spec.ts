import RandomGenerator from '../../../src/random/generator/RandomGenerator';
import LinearCongruential from '../../../src/random/generator/LinearCongruential';
import * as p from './RandomGenerator.properties';
import * as jsc from 'jsverify';

function rng_for(seed: number): RandomGenerator {
    return new LinearCongruential(seed);
}

describe("LinearCongruential", () => {
    it("Should return the same sequence given same seeds", () => jsc.assert(p.sameSeedSameSequences(rng_for)));
    it("Should return the same sequence if called twice", () => jsc.assert(p.sameSequencesIfCallTwice(rng_for)));
    it("Should generate values between -2**31 and 2**31 -1", () => jsc.assert(p.valuesInRange(rng_for)));
});
