import * as assert from 'power-assert';
import * as fc from '../../../src/fast-check'

const seed = Date.now();
describe(`IntegerArbitrary (seed: ${seed})`, () => {
    describe('integer', () => {
        it('Should generate integer within the range', () => {
            const out = fc.check(fc.property(fc.integer(-42, -10), (v: number) => -42 <= v && v <= -10), {seed: seed});
            assert.ok(!out.failed, 'Should have succeeded');
        });
        it('Should shrink integer with strictly negative range', () => {
            const out = fc.check(fc.property(fc.integer(-1000, -10), (v: number) => v > -100), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [-100], 'Should shrink to counterexample -100');
        });
    });
    describe('nat', () => {
        it('Should generate natural numbers', () => {
            const out = fc.check(fc.property(fc.nat(), (v: number) => v >= 0), {seed: seed});
            assert.ok(!out.failed, 'Should have succeeded');
        });
        it('Should shrink natural number', () => {
            const out = fc.check(fc.property(fc.nat(), (v: number) => v < 100), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [100], 'Should shrink to counterexample 100');
        });
    });
});
