import * as assert from 'power-assert';
import prand from 'pure-rand';
import fc from '../../../../lib/fast-check';

import MutableRandomGenerator from '../../../../src/random/generator/MutableRandomGenerator';

class DummyRandomGenerator implements prand.RandomGenerator {
    value: number;
    constructor(value: number) {
        this.value = value;
    }
    next(): [number, prand.RandomGenerator] {
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
    it('Should produce the same values as its underlying', () => fc.assert(
        fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
            let rng = new DummyRandomGenerator(seed);
            const mrng = new MutableRandomGenerator(rng);
            const seq1 = prand.generateN(prand.skipN(rng, offset), num)[0];
            const seq2 = prand.generateN(prand.skipN(mrng, offset), num)[0];
            assert.deepEqual(seq1, seq2);
        })
    ));
});
