import * as assert from 'power-assert';

import { constant } from '../../../../src/check/arbitrary/ConstantArbitrary';

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
});
