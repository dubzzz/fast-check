import * as assert from 'power-assert';
import * as fc from '../../../src/fast-check'

const seed = Date.now();
describe(`OneOfArbitrary (seed: ${seed})`, () => {
    describe('oneof', () => {
        it('Should one of the possible element', () => {
            const out = fc.check(fc.property(fc.oneof(fc.constant(42), fc.constant(5)), (v: number) => v === 42 || v === 5), {seed: seed});
            assert.ok(!out.failed, 'Should have succeeded');
        });
        it('Should shrink on the underlying arbitrary', () => {
            const out = fc.check(fc.property(fc.oneof(
                fc.integer(-10, -1), fc.integer(0, 9), fc.integer(10, 19), fc.integer(20, 29)
            ), (v: number) => v < 14 || v >= 20), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [14], 'Should shrink to counterexample 14'); // expect the same as for fc.integer(10, 19)
        });
    });
});
