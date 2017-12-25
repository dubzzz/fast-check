import * as assert from 'power-assert';
import * as sc from '../../../src/simple-check'

const seed = Date.now();
describe(`TupleArbitrary (seed: ${seed})`, () => {
    describe('tuple', () => {
        it('Should shrink on tuple2', () => {
            const out = sc.check(sc.property(sc.tuple(sc.nat(), sc.nat()), (v: [number,number]) => v[0] < 100 || v[1] < 50), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [[100,50]], 'Should shrink to counterexample [100,50]');
        });
    });
});
