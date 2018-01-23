import * as assert from 'power-assert';
import * as fc from '../../../src/fast-check';

const seed = Date.now();
describe(`TupleArbitrary (seed: ${seed})`, () => {
    describe('tuple', () => {
        it('Should shrink on tuple2', () => {
            const out = fc.check(fc.property(fc.tuple(fc.nat(), fc.nat()), (v: [number,number]) => v[0] < 100 || v[1] < 50), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [[100,50]], 'Should shrink to counterexample [100,50]');
        });
    });
});
