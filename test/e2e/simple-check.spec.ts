import * as assert from 'power-assert';
import * as sc from '../../src/check/simple-check'

const seed = Date.now();
describe(`simple-check (seed: ${seed})`, () => {
    describe('IntegerArbitrary', () => {
        it('Should fail and shrink to value = 100', () => {
            const out = sc.check(sc.property(sc.nat(), (v: number) => v < 100), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [100], 'Should shrink to counterexample 100');
        });
    });
});
