import * as assert from 'power-assert';
import * as fc from '../../../lib/fast-check';

import Arbitrary from '../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../src/check/arbitrary/definition/Shrinkable';
import { array } from '../../../src/check/arbitrary/ArrayArbitrary';
import { integer } from '../../../src/check/arbitrary/IntegerArbitrary';
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';

import { FastIncreaseRandomGenerator } from '../../stubs/generators';

class DummyArbitrary extends Arbitrary<any> {
    constructor(public value:() => number) {
        super();
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<any> {
        return new Shrinkable({ key: this.value() });
    }
}

describe("ArrayArbitrary", () => {
    describe('array', () => {
        it('Should generate an array using specified arbitrary', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = new MutableRandomGenerator(new FastIncreaseRandomGenerator(seed));
                const g = array(new DummyArbitrary(() => 42)).generate(mrng).value;
                assert.deepEqual(g, [...Array(g.length)].map(() => new Object({key: 42})));
                return true;
            })
        ));
        it('Should generate the same array with the same random', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng1 = new MutableRandomGenerator(new FastIncreaseRandomGenerator(seed));
                const mrng2 = new MutableRandomGenerator(new FastIncreaseRandomGenerator(seed));
                assert.deepEqual(array(integer()).generate(mrng1).value, array(integer()).generate(mrng2).value);
                return true;
            })
        ));
        it('Should generate an array calling multiple times arbitrary generator', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = new MutableRandomGenerator(new FastIncreaseRandomGenerator(seed));
                let num = 0;
                const g = array(new DummyArbitrary(() => ++num)).generate(mrng).value;
                let numBis = 0;
                assert.deepEqual(g, [...Array(g.length)].map(() => new Object({key: ++numBis})));
                return true;
            })
        ));
        it('Should generate an array given maximal length', () => fc.assert(
            fc.property(fc.integer(), fc.integer(0, 10000), (seed, maxLength) => {
                const mrng = new MutableRandomGenerator(new FastIncreaseRandomGenerator(seed));
                const g = array(new DummyArbitrary(() => 42), maxLength).generate(mrng).value;
                return g.length <= maxLength;
            })
        ));
        it('Should shrink values in the defined range', () => fc.assert(
            fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new FastIncreaseRandomGenerator(seed));
                const arb = array(integer(min, min + num));
                const shrinkable = arb.generate(mrng);
                return shrinkable.shrink().every(s => s.value.every(vv => min <= vv && vv <= min + num));
            })
        ));
        it('Should not suggest input in shrinked values', () => fc.assert(
            fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new FastIncreaseRandomGenerator(seed));
                const arb = array(integer(min, min + num));
                const shrinkable = arb.generate(mrng);
                const tab = shrinkable.value;
                return shrinkable.shrink().every(s => s.value.length !== tab.length || !s.value.every((vv,idx) => vv === tab[idx]));
            })
        ));
    });
});
