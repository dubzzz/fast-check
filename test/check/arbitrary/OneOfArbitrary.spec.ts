import * as assert from 'power-assert';
import { DummyRandomGenerator } from './TestRandomGenerator'
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import Arbitrary from '../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../src/check/arbitrary/definition/Shrinkable';
import { constant } from '../../../src/check/arbitrary/ConstantArbitrary';
import { oneof } from '../../../src/check/arbitrary/OneOfArbitrary';
import { stream } from '../../../src/stream/Stream'
import * as fc from '../../../src/fast-check';

class CustomArbitrary extends Arbitrary<number> {
    constructor(readonly value: number) {
        super();
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<number> {
        function* g(v: number) {
            yield new Shrinkable(v -42);
        }
        return new Shrinkable(this.value, () => stream(g(this.value)));
    }
}

describe("OneOfArbitrary", () => {
    describe('oneof', () => {
        it('Should generate based on one of the given arbitraries', () => fc.assert(
            fc.property(fc.integer(), fc.integer(), fc.array(fc.integer()), (seed, choice1, others) => {
                const choices = [choice1, ...others];
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = oneof(constant(choice1), ...others.map(constant)).generate(mrng).value;
                return choices.indexOf(g) !== -1;
            })
        ));
        it('Should call the right shrink on shrink', () => fc.assert(
            fc.property(fc.integer(), fc.integer(), fc.array(fc.integer()), (seed, choice1, others) => {
                const choices = [choice1, ...others].map(c => new CustomArbitrary(c));
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const shrinkable = oneof(choices[0], ...choices.slice(1)).generate(mrng);
                const shrinks = [...shrinkable.shrink()];
                return shrinks.length === 1 && shrinks[0].value === shrinkable.value -42;
            })
        ))
    });
});
