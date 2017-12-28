import * as assert from 'power-assert';
import RandomGenerator from '../../../src/random/generator/RandomGenerator';
import LinearCongruential from '../../../src/random/generator/LinearCongruential';
import * as p from './RandomGenerator.properties';
import * as fc from '../../../src/fast-check';

function rng_for(seed: number): RandomGenerator {
    return new LinearCongruential(seed);
}

describe('LinearCongruential', () => {
    it('Should produce the right sequence for seed=42', () => {
        let g = rng_for(42);
        let data = [];
        for (let idx = 0 ; idx !== 10 ; ++idx) {
            const [v, nextG] = g.next();
            data.push(v);
            g = nextG;
        }

        // Same values as Visual C++ rand() for srand(42)
        assert.deepEqual(data, [
            175, 400, 17869,
            30056, 16083, 12879,
            8016, 7644, 15809,
            1769]);
    });
    it('Should return the same sequence given same seeds', () => fc.assert(p.sameSeedSameSequences(rng_for)));
    it('Should return the same sequence if called twice', () => fc.assert(p.sameSequencesIfCallTwice(rng_for)));
    it('Should generate values between 0 and 2**15 -1', () => fc.assert(p.valuesInRange(rng_for)));
});
