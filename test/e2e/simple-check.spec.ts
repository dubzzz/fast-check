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
    describe('ArrayArbitrary', () => {
        it('Should shrink on the size of the array', () => {
            const out = sc.check(sc.property(sc.array(sc.nat()), (arr: number[]) => arr.length < 2), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            if (out.counterexample) {
                assert.deepEqual(out.counterexample[0].length, 2, 'Should shrink to counterexample an array of size 2');
            }
            else {
                assert.fail();
            }
        });
        it('Should shrink on the content of the array', () => {
            const out = sc.check(sc.property(sc.array(sc.integer(3,10)), (arr: number[]) => arr.length < 2), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [[3,3]], 'Should shrink to counterexample [3,3]');
        });
        it('Should shrink removing unecessary entries in the array', () => {
            const out = sc.check(sc.property(sc.array(sc.integer(0,10)), (arr: number[]) => arr.filter(v => v >= 5).length < 2), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [[5,5]], 'Should shrink to counterexample [5,5]');
        });
    });
    describe('TupleArbitrary', () => {
        it('Should shrink on tuple2', () => {
            const out = sc.check(sc.property(sc.tuple(sc.nat(), sc.nat()), (v: [number,number]) => v[0] < 100 || v[1] < 50), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [[100,50]], 'Should shrink to counterexample [100,50]');
        });
    });
});
