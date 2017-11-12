import * as assert from 'power-assert';
import * as sc from '../../src/check/simple-check'

const seed = Date.now();
describe(`simple-check (seed: ${seed})`, () => {
    describe('IntegerArbitrary', () => {
        it('Should shrink natural number', () => {
            const out = sc.check(sc.property(sc.nat(), (v: number) => v < 100), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [100], 'Should shrink to counterexample 100');
        });
        it('Should shrink integer with strictly negative range', () => {
            const out = sc.check(sc.property(sc.integer(-1000, -10), (v: number) => v > -100), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [-100], 'Should shrink to counterexample -100');
        });
    });
    describe('TupleArbitrary', () => {
        it('Should shrink on tuple2', () => {
            const out = sc.check(sc.property(sc.nat(), sc.nat(), (v1: number, v2: number) => v1 < 100 || v2 < 50), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [100,50], 'Should shrink to counterexample [100,50]');
        });
    });
});
