import * as assert from 'power-assert';
import { DummyRandomGenerator } from '../TestRandomGenerator'
import MutableRandomGenerator from '../../../../src/random/generator/MutableRandomGenerator';
import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import * as jsc from 'jsverify';

class ForwardArbitrary extends Arbitrary<number> {
    generate(mrng: MutableRandomGenerator): Shrinkable<number> {
        return new Shrinkable(mrng.next()[0]);
    }
}

describe("Arbitrary", () => {
    describe('filter', () => {
        it('Should filter unsuitable values from the underlying arbitrary', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = new ForwardArbitrary().filter(v => v % 3 === 0).generate(mrng).value;
                assert.ok(g % 3 === 0);
                return true;
            })
        ));
    });
    describe('map', () => {
        it('Should appply mapper function to produced values', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng1 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const mrng2 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = new ForwardArbitrary().map(v => `value = ${v}`).generate(mrng1).value;
                assert.equal(g, `value = ${new ForwardArbitrary().generate(mrng2).value}`);
                return true;
            })
        ));
    });
});
