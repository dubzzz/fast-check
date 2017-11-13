import * as assert from 'power-assert';
import { DummyRandomGenerator } from './TestRandomGenerator'
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import Arbitrary from '../../../src/check/arbitrary/Arbitrary';
import { array } from '../../../src/check/arbitrary/ArrayArbitrary';
import { integer } from '../../../src/check/arbitrary/IntegerArbitrary';
import * as jsc from 'jsverify';

class DummyArbitrary extends Arbitrary<any> {
    constructor(public value:() => number) {
        super();
    }
    generate(mrng: MutableRandomGenerator) {
        return { key: this.value() };
    }
}

describe("ArrayArbitrary", () => {
    describe('array', () => {
        it('Should generate an array using specified arbitrary', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = array(new DummyArbitrary(() => 42)).generate(mrng);
                assert.deepEqual(g, [...Array(g.length)].map(() => new Object({key: 42})));
                return true;
            })
        ));
        it('Should generate the same array with the same random', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng1 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const mrng2 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                assert.deepEqual(array(integer()).generate(mrng1), array(integer()).generate(mrng2));
                return true;
            })
        ));
        it('Should generate an array calling multiple times arbitrary generator', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                let num = 0;
                const g = array(new DummyArbitrary(() => ++num)).generate(mrng);
                let numBis = 0;
                assert.deepEqual(g, [...Array(g.length)].map(() => new Object({key: ++numBis})));
                return true;
            })
        ));
        it('Should generate an array given maximal length', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer(0, 10000), (seed, maxLength) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = array(new DummyArbitrary(() => 42), maxLength).generate(mrng);
                return g.length <= maxLength;
            })
        ));
        it('Should shrink values in the defined range', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = array(integer(min, min + num));
                const tab = arb.generate(mrng);
                return arb.shrink(tab).every(g => g.every(vv => min <= vv && vv <= min + num));
            })
        ));
        it('Should not suggest input in shrinked values', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = array(integer(min, min + num));
                const tab = arb.generate(mrng);
                return arb.shrink(tab).every(g => g.length !== tab.length || !g.every((vv,idx) => vv === tab[idx]));
            })
        ));
    });
});
