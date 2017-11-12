import * as assert from 'power-assert';
import { DummyRandomGenerator } from './TestRandomGenerator'
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import Arbitrary from '../../../src/check/arbitrary/Arbitrary';
import { tuple } from '../../../src/check/arbitrary/TupleArbitrary';
import { integer } from '../../../src/check/arbitrary/IntegerArbitrary';
import * as jsc from 'jsverify';

class DummyArbitrary extends Arbitrary<string> {
    constructor(public id: number) {
        super();
    }
    generate(mrng: MutableRandomGenerator) {
        return `key${this.id}_${integer().generate(mrng)}`;
    }
}
function dummy(id: number) {
    return new DummyArbitrary(id);
}

function propertySameTupleForSameSeed(...arbs: DummyArbitrary[]) {
    if (arbs.length === 0 || arbs.length > 9) {
        throw "Unexpected length should be between 1 and 9";
    }
    const arb = tuple(arbs[0], ...arbs.slice(1));
    return jsc.forall(jsc.integer, (seed) => {
        const mrng1 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
        const mrng2 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
        const g1 = arb.generate(mrng1);
        assert.ok(g1.every((v, idx) => v.startsWith(`key${arbs[idx].id}_`)));
        assert.deepEqual(arb.generate(mrng2), g1);
        return true;
    });
}

describe('TupleArbitrary', () => {
    describe('tuple', () => {
        it('Should generate the same tuple1 with the same random', () => jsc.assert(
            propertySameTupleForSameSeed(dummy(1))
        ));
        it('Should generate the same tuple2 with the same random', () => jsc.assert(
            propertySameTupleForSameSeed(dummy(1), dummy(2))
        ));
        it('Should generate the same tuple3 with the same random', () => jsc.assert(
            propertySameTupleForSameSeed(dummy(1), dummy(2), dummy(3))
        ));
        it('Should generate the same tuple4 with the same random', () => jsc.assert(
            propertySameTupleForSameSeed(
                dummy(1), dummy(2), dummy(3),
                dummy(11), dummy(12))
        ));
        it('Should generate the same tuple5 with the same random', () => jsc.assert(
            propertySameTupleForSameSeed(
                dummy(1), dummy(2), dummy(3),
                dummy(11), dummy(12))
        ));
        it('Should generate the same tuple6 with the same random', () => jsc.assert(
            propertySameTupleForSameSeed(
                dummy(1), dummy(2), dummy(3),
                dummy(11), dummy(12), dummy(13))
        ));
        it('Should generate the same tuple7 with the same random', () => jsc.assert(
            propertySameTupleForSameSeed(
                dummy(1), dummy(2), dummy(3),
                dummy(11), dummy(12), dummy(13),
                dummy(21))
        ));
        it('Should generate the same tuple8 with the same random', () => jsc.assert(
            propertySameTupleForSameSeed(
                dummy(1), dummy(2), dummy(3),
                dummy(11), dummy(12), dummy(13),
                dummy(21), dummy(22))
        ));
        it('Should generate the same tuple9 with the same random', () => jsc.assert(
            propertySameTupleForSameSeed(
                dummy(1), dummy(2), dummy(3),
                dummy(11), dummy(12), dummy(13),
                dummy(21), dummy(22), dummy(23))
        ));
    });
});
