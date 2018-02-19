import * as assert from 'power-assert';
import * as fc from '../../../../lib/fast-check';

import { constant, constantFrom } from '../../../../src/check/arbitrary/ConstantArbitrary';

import * as stubRng from '../../stubs/generators';

describe("ConstantArbitrary", () => {
    describe('constant', () => {
        it('Should always return the constant', () => {
            const mrng = stubRng.mutable.nocall();
            const g = constant(42).generate(mrng).value;
            assert.equal(g, 42);
        });
        it('Should always return the original instance', () => {
            let instance = ["hello"];
            const mrng = stubRng.mutable.nocall();
            const g = constant(instance).generate(mrng).value;
            assert.deepEqual(g, ["hello"]);
            instance.push("world");
            assert.deepEqual(g, ["hello", "world"]);
        });
    });
    describe('constantFrom', () => {
        it('Should always return one of the constants', () => fc.assert(
            fc.property(fc.array(fc.string(), 1, 10), fc.integer(), (data, seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const g = constantFrom(data[0], ...data.slice(1)).generate(mrng).value;
                return data.indexOf(g) !== -1;
            })
        ));
        it('Should be able to produce all the constants', () => fc.assert(
            fc.property(fc.array(fc.string(), 1, 10), fc.integer(), (data, seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const arb = constantFrom(data[0], ...data.slice(1));
                for (let id = 0 ; id != 10000 ; ++id) {
                    const g = arb.generate(mrng).value;
                    if (data.indexOf(g) !== -1) return true;
                }
                return false;
            })
        ));
        it('Should shrink any of the constants towards the first one', () => fc.assert(
            fc.property(fc.set(fc.string(), 1, 10), fc.integer(), (data, seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const shrinkable = constantFrom(data[0], ...data.slice(1)).generate(mrng);
                if (data.indexOf(shrinkable.value) === 0)
                    assert.deepStrictEqual([...shrinkable.shrink()], []);
                else
                    assert.deepStrictEqual([...shrinkable.shrink()].map(s => s.value), [data[0]]);
            })
        ));
    });
});
