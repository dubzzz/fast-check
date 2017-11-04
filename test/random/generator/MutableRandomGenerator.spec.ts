import * as assert from 'power-assert';
import { RandomGenerator, skip_n, generate_n } from '../../../src/random/generator/RandomGenerator';
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import * as jsc from 'jsverify';

class DummyRandomGenerator implements RandomGenerator {
    value: number;
    constructor(value: number) {
        this.value = value;
    }
    next(): [number, RandomGenerator] {
        return [this.value, new DummyRandomGenerator((this.value +1) | 0)];
    }
    min(): number {
        throw new Error("Method not implemented.");
    }
    max(): number {
        throw new Error("Method not implemented.");
    }
}

const MAX_SIZE: number = 2048;

describe("MutableRandomGenerator", () => {
    it('Should produce the same values as its underlying', () => jsc.assert(
        jsc.forall(jsc.integer, jsc.nat(MAX_SIZE), jsc.nat(MAX_SIZE), (seed, offset, num) => {
            let rng = new DummyRandomGenerator(seed);
            const mrng = new MutableRandomGenerator(rng);
            const seq1 = generate_n(skip_n(rng, offset), num)[0];
            const seq2 = generate_n(skip_n(mrng, offset), num)[0];
            assert.deepEqual(seq1, seq2);
            return true;
        })
    ));
});
