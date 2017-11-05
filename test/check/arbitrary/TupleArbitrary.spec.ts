import * as assert from 'power-assert';
import { DummyRandomGenerator } from './TestRandomGenerator'
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import Arbitrary from '../../../src/check/arbitrary/Arbitrary';
import { tuple } from '../../../src/check/arbitrary/TupleArbitrary';
import { integer } from '../../../src/check/arbitrary/IntegerArbitrary';
import * as jsc from 'jsverify';

class DummyArbitrary implements Arbitrary<string> {
    constructor(public id: number) {
    }
    generate(mrng: MutableRandomGenerator) {
        return `key${this.id}_${integer().generate(mrng)}`;
    }
}
function dummy(id: number) {
    return new DummyArbitrary(id);
}

describe("TupleArbitrary", () => {
    describe('tuple', () => {
        it('Should generate the same tuple1 with the same random', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng1 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const mrng2 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = tuple(dummy(1));
                const g1 = arb.generate(mrng1);
                assert.ok(g1[0].indexOf("key1_") === 0);
                assert.deepEqual(arb.generate(mrng2), g1);
                return true;
            })
        ));
        it('Should generate the same tuple2 with the same random', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng1 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const mrng2 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = tuple(dummy(1), dummy(2));
                const g1 = arb.generate(mrng1);
                assert.ok(g1[0].indexOf("key1_") === 0);
                assert.ok(g1[1].indexOf("key2_") === 0);
                assert.deepEqual(arb.generate(mrng2), g1);
                return true;
            })
        ));
    });
});
