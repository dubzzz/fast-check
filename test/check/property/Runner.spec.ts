import * as assert from 'power-assert';
import IProperty from '../../../src/check/property/IProperty';
import { check, assert as rAssert } from '../../../src/check/property/Runner';
import Shrinkable from '../../../src/check/arbitrary/definition/Shrinkable';
import Stream from '../../../src/stream/Stream'
import * as jsc from 'jsverify';

describe('Runner', () => {
    describe('check', () => {
        it('Should call the property 100 times by default (on success)', () => {
            let num_calls = 0;
            const p: IProperty<[number]> = {
                run: () => {
                    ++num_calls;
                    return [null, new Shrinkable([0]) as Shrinkable<[number]>];
                },
                runOne: () => { throw 'Not implemented'; }
            };
            const out = check(p);
            assert.equal(num_calls, 100, 'Should have been called 100 times');
            assert.equal(out.failed, false, 'Should not have failed');
        });
        it('Should never call shrink on success', () => {
            let num_calls = 0;
            const p: IProperty<[number]> = {
                run: () => {
                    ++num_calls;
                    return [null, new Shrinkable([0], () => { throw 'Not implemented'; }) as Shrinkable<[number]>];
                },
                runOne: () => { throw 'Not implemented'; },
            };
            const out = check(p);
            assert.equal(num_calls, 100, 'Should have been called 100 times');
            assert.equal(out.failed, false, 'Should not have failed');
        });
        it('Should call the property 100 times by default (except on error)', () => jsc.assert(
            jsc.forall(jsc.integer(1, 100), jsc.integer, (num, seed) => {
                let num_calls = 0;
                const p: IProperty<[number]> = {
                    run: () => {
                        return [++num_calls < num ? null : "error", new Shrinkable([0]) as Shrinkable<[number]>];
                    },
                    runOne: () => { throw 'Not implemented'; }
                };
                const out = check(p, {seed: seed});
                assert.equal(num_calls, num, `Should have stopped at first failing run (run number ${num})`);
                assert.ok(out.failed, 'Should have failed');
                assert.equal(out.num_runs, num, `Should have failed after ${num} tests`);
                assert.equal(out.seed, seed, `Should attach the failing seed`);
                return true;
            })
        ));
        it('Should alter the number of runs when asked to', () => jsc.assert(
            jsc.forall(jsc.nat, (num) => {
                let num_calls = 0;
                const p: IProperty<[number]> = {
                    run: () => {
                        ++num_calls;
                        return [null, new Shrinkable([0]) as Shrinkable<[number]>];
                    },
                    runOne: () => { throw 'Not implemented'; }
                };
                const out = check(p, {num_runs: num});
                assert.equal(num_calls, num, `Should have been called ${num} times`);
                assert.equal(out.failed, false, 'Should not have failed');
                return true;
            })
        ));
    });
    describe('assert', () => {
        const v1 = { toString: () => "toString(value#1)" };
        const v2 = { a: "Hello", b: 21 };
        const failingProperty: IProperty<[any,any]> = {
            run: () => ["error in failingProperty", new Shrinkable([v1,v2]) as Shrinkable<[any,any]>],
            runOne: () => { throw 'Not implemented'; }
        };
        const failingComplexProperty: IProperty<[any,any,any]> = {
            run: () => ["error in failingComplexProperty", new Shrinkable([[v1,v2],v2,v1]) as Shrinkable<[any,any,any]>],
            runOne: () => { throw 'Not implemented'; }
        };
        const successProperty: IProperty<[any,any]> = {
            run: () => [null, new Shrinkable([v1,v2]) as Shrinkable<[any,any]>],
            runOne: () => { throw 'Not implemented'; }
        };

        it('Should never throw if no failure occured', () => {
            try {
                rAssert(successProperty, {seed: 42});
            }
            catch (err) {
                assert.ok(false, "No exception expected on success");
            }
        });
        it('Should throw on failure', () => {
            try {
                rAssert(failingProperty, {seed: 42});
            }
            catch (err) { return; }
            assert.ok(false, "Expected an exception, got success");
        });
        it('Should put the seed in error message', () => {
            try {
                rAssert(failingProperty, {seed: 42});
            }
            catch (err) {
                assert.ok(err.indexOf(`(seed: 42)`) !== -1, `Cannot find the seed in: ${err}`);
                return;
            }
            assert.ok(false, "Expected an exception, got success");
        });
        it('Should put the number of tests in error message', () => {
            try {
                rAssert(failingProperty, {seed: 42});
            }
            catch (err) {
                assert.ok(err.indexOf(`failed after 1 test`) !== -1, `Cannot find the number of tests in: ${err}`);
                return;
            }
            assert.ok(false, "Expected an exception, got success");
        });
        it('Should pretty print the failing example in error message', () => {
            try {
                rAssert(failingProperty, {seed: 42});
            }
            catch (err) {
                assert.ok(err.indexOf(`[${v1.toString()},${JSON.stringify(v2)}]`) !== -1, `Cannot find the example in: ${err}`);
                return;
            }
            assert.ok(false, "Expected an exception, got success");
        });
        it('Should pretty print the failing complex example in error message', () => {
            try {
                rAssert(failingComplexProperty, {seed: 42});
            }
            catch (err) {
                assert.ok(err.indexOf(`[[${v1.toString()},${JSON.stringify(v2)}],${JSON.stringify(v2)},${v1.toString()}]`) !== -1, `Cannot find the example in: ${err}`);
                return;
            }
            assert.ok(false, "Expected an exception, got success");
        });
        it('Should put the orginal error in error message', () => {
            try {
                rAssert(failingProperty, {seed: 42});
            }
            catch (err) {
                assert.ok(err.indexOf(`Got error: error in failingProperty`) !== -1, `Cannot find the original error in: ${err}`);
                return;
            }
            assert.ok(false, "Expected an exception, got success");
        });
    });
});
