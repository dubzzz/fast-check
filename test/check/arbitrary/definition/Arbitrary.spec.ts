import * as assert from 'power-assert';
import { DummyRandomGenerator } from '../TestRandomGenerator'
import MutableRandomGenerator from '../../../../src/random/generator/MutableRandomGenerator';
import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import { Stream, stream } from '../../../../src/stream/Stream';
import * as fc from '../../../../src/fast-check';

class ForwardArbitrary extends Arbitrary<number> {
    private shrinkableFor(v: number): Shrinkable<number> {
        function* g(vv: number): IterableIterator<number> {
            yield* [...Array(50)].map((u, i) => i + vv);
        }
        return new Shrinkable(v, () => stream(g(v)).map(vv => this.shrinkableFor(vv)))
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<number> {
        return this.shrinkableFor(mrng.next()[0]);
    }
}

describe("Arbitrary", () => {
    describe('filter', () => {
        it('Should filter unsuitable values from the underlying arbitrary', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = new ForwardArbitrary().filter(v => v % 3 === 0).generate(mrng).value;
                assert.ok(g % 3 === 0);
                return true;
            })
        ));
        it('Should filter unsuitable values from shrink', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const shrinkable = new ForwardArbitrary().filter(v => v % 3 === 0).generate(mrng);
                assert.ok(shrinkable.shrink().every(s => s.value % 3 === 0));
                return true;
            })
        ));
        it('Should filter unsuitable values from shrink of shrink', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const shrinkable = new ForwardArbitrary().filter(v => v % 3 === 0).generate(mrng);
                assert.ok(shrinkable.shrink().flatMap(s => s.shrink()).every(s => s.value % 3 === 0));
                return true;
            })
        ));
    });
    describe('map', () => {
        it('Should apply mapper to produced values', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng1 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const mrng2 = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = new ForwardArbitrary().map(v => `value = ${v}`).generate(mrng1).value;
                assert.equal(g, `value = ${new ForwardArbitrary().generate(mrng2).value}`);
                return true;
            })
        ));
        it('Should apply mapper to shrink values', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const shrinkable = new ForwardArbitrary().map(v => `value = ${v}`).generate(mrng);
                assert.ok(shrinkable.shrink().every(s => s.value.startsWith("value = ")));
                return true;
            })
        ));
        it('Should apply mapper to shrink of shrink values', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const shrinkable = new ForwardArbitrary().map(v => `value = ${v}`).generate(mrng);
                assert.ok(shrinkable.shrink().flatMap(s => s.shrink()).every(s => s.value.startsWith("value = ")));
                return true;
            })
        ));
    });
});
