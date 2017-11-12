import * as assert from 'power-assert';
import IProperty from '../../../src/check/property/IProperty';
import { check } from '../../../src/check/property/Runner';
import Stream from '../../../src/stream/Stream'
import * as jsc from 'jsverify';

describe('Runner', () => {
    it('Should call the property 100 times by default (on success)', () => {
        let num_calls = 0;
        const p: IProperty<[number]> = {
            run: () => {
                ++num_calls;
                return [true, [0]];
            },
            runOne: () => { throw 'Not implemented'; },
            shrink: () => Stream.nil<[number]>()
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
                    return [++num_calls < num, [0]];
                },
                runOne: () => { throw 'Not implemented'; },
                shrink: () => Stream.nil<[number]>()
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
                    return [true, [0]];
                },
                runOne: () => { throw 'Not implemented'; },
                shrink: () => Stream.nil<[number]>()
            };
            const out = check(p, {num_runs: num});
            assert.equal(num_calls, num, `Should have been called ${num} times`);
            assert.equal(out.failed, false, 'Should not have failed');
            return true;
        })
    ));
});
