import * as assert from 'power-assert';
import * as fc from '../../../lib/fast-check';

import Shrinkable from '../../../src/check/arbitrary/definition/Shrinkable';
import IProperty from '../../../src/check/property/IProperty';
import { check, assert as rAssert } from '../../../src/check/runner/Runner';

const MAX_NUM_RUNS = 1000;
describe('Runner', () => {
    describe('check', () => {
        it('Should call the property 100 times by default (on success)', () => {
            let num_calls_generate = 0;
            let num_calls_run = 0;
            const p: IProperty<[number]> = {
                generate: () => {
                    assert.equal(num_calls_run, num_calls_generate, 'Should have called run before calling back');
                    ++num_calls_generate;
                    return new Shrinkable([num_calls_generate]) as Shrinkable<[number]>;
                },
                run: (value: [number]) => {
                    assert.equal(value[0], num_calls_generate, 'Should be called with previously generated value');
                    ++num_calls_run;
                    return null;
                }
            };
            const out = check(p);
            assert.equal(num_calls_generate, 100, 'Should have called generate 100 times');
            assert.equal(num_calls_run, 100, 'Should have called run 100 times');
            assert.equal(out.failed, false, 'Should not have failed');
        });
        it('Should never call shrink on success', () => {
            let num_calls_generate = 0;
            let num_calls_run = 0;
            const p: IProperty<[number]> = {
                generate: () => {
                    ++num_calls_generate;
                    return new Shrinkable([0], () => { throw 'Not implemented'; }) as Shrinkable<[number]>;
                },
                run: (value: [number]) => {
                    ++num_calls_run;
                    return null;
                },
            };
            const out = check(p);
            assert.equal(num_calls_generate, 100, 'Should have called generate 100 times');
            assert.equal(num_calls_run, 100, 'Should have called run 100 times');
            assert.equal(out.failed, false, 'Should not have failed');
        });
        it('Should call the property 100 times by default (except on error)', () => fc.assert(
            fc.property(fc.integer(1, 100), fc.integer(), (num, seed) => {
                let num_calls_generate = 0;
                let num_calls_run = 0;
                const p: IProperty<[number]> = {
                    generate: () => {
                        ++num_calls_generate;
                        return new Shrinkable([0]) as Shrinkable<[number]>;
                    },
                    run: (value: [number]) => {
                        return ++num_calls_run < num ? null : "error";
                    }
                };
                const out = check(p, {seed: seed});
                assert.equal(num_calls_generate, num, `Should have stopped generate at first failing run (run number ${num})`);
                assert.equal(num_calls_run, num, `Should have stopped run (because no shrink) at first failing run (run number ${num})`);
                assert.ok(out.failed, 'Should have failed');
                assert.equal(out.num_runs, num, `Should have failed after ${num} tests`);
                assert.equal(out.seed, seed, `Should attach the failing seed`);
                return true;
            })
        ));
        it('Should alter the number of runs when asked to', () => fc.assert(
            fc.property(fc.nat(MAX_NUM_RUNS), (num) => {
                let num_calls_generate = 0;
                let num_calls_run = 0;
                const p: IProperty<[number]> = {
                    generate: () => {
                        ++num_calls_generate;
                        return new Shrinkable([0]) as Shrinkable<[number]>;
                    },
                    run: (value: [number]) => {
                        ++num_calls_run;
                        return null;
                    }
                };
                const out = check(p, {num_runs: num});
                assert.equal(num_calls_generate, num, `Should have called generate ${num} times`);
                assert.equal(num_calls_run, num, `Should have called run ${num} times`);
                assert.equal(out.failed, false, 'Should not have failed');
                return true;
            })
        ));
    });
    describe('assert', () => {
        const v1 = { toString: () => "toString(value#1)" };
        const v2 = { a: "Hello", b: 21 };
        const failingProperty: IProperty<[any,any]> = {
            generate: () => new Shrinkable([v1,v2]) as Shrinkable<[any,any]>,
            run: (v: [any,any]) => "error in failingProperty"
        };
        const failingComplexProperty: IProperty<[any,any,any]> = {
            generate: () => new Shrinkable([[v1,v2],v2,v1]) as Shrinkable<[any,any,any]>,
            run: (v: [any,any,any]) => "error in failingComplexProperty"
        };
        const successProperty: IProperty<[any,any]> = {
            generate: () => new Shrinkable([v1,v2]) as Shrinkable<[any,any]>,
            run: (v: [any,any]) => null
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
