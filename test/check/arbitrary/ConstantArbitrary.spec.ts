import * as assert from 'power-assert';
import { NoCallGenerator } from './TestRandomGenerator'
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import { constant } from '../../../src/check/arbitrary/ConstantArbitrary';
import * as jsc from 'jsverify';

describe("ConstantArbitrary", () => {
    describe('constant', () => {
        it('Should always return the constant', () => {
            const mrng = new MutableRandomGenerator(new NoCallGenerator());
            const g = constant(42).generate(mrng);
            assert.equal(g, 42);
        });
        it('Should always return the original instance', () => {
            let instance = ["hello"];
            const mrng = new MutableRandomGenerator(new NoCallGenerator());
            const g = constant(instance).generate(mrng);
            assert.deepEqual(g, ["hello"]);
            instance.push("world");
            assert.deepEqual(g, ["hello", "world"]);
        });
    });
});
