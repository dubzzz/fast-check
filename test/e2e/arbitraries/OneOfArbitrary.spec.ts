import * as assert from 'power-assert';
import * as sc from '../../../src/simple-check'

const seed = Date.now();
describe(`OneOfArbitrary (seed: ${seed})`, () => {
    describe('oneof', () => {
        it('Should one of the possible element', () => {
            const out = sc.check(sc.property(sc.oneof(sc.constant(42), sc.constant(5)), (v: number) => v === 42 || v === 5), {seed: seed});
            assert.ok(!out.failed, 'Should have succeeded');
        });
        it('Should shrink on the underlying arbitrary', () => {
            const out = sc.check(sc.property(sc.oneof(
                sc.integer(-10, -1), sc.integer(0, 9), sc.integer(10, 19), sc.integer(20, 29)
            ), (v: number) => v < 14 || v >= 20), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [14], 'Should shrink to counterexample 14'); // expect the same as for sc.integer(10, 19)
        });
    });
});
