import * as assert from 'power-assert';
import * as fc from '../../../lib/fast-check';

import { sample } from '../../../src/check/runner/Sampler';

import { CounterArbitrary, ForwardArbitrary } from '../../stubs/arbitraries';

const MAX_NUM_RUNS = 1000;
describe('Sampler', () => {
    describe('sample', () => {
        it('Should produce the same sequence given the same seed', () => {
            fc.property(fc.integer(), (seed) => {
                const out1 = sample(new ForwardArbitrary(), {seed: seed});
                const out2 = sample(new ForwardArbitrary(), {seed: seed});
                assert.deepEqual(out2, out1, 'Should be the same array');
            });
        });
        it('Should produce the same sequence given the same seed and different lengths', () => {
            fc.property(fc.integer(), fc.nat(MAX_NUM_RUNS), fc.nat(MAX_NUM_RUNS), (seed, l1, l2) => {
                const out1 = sample(new ForwardArbitrary(), {seed: seed, num_runs: l1});
                const out2 = sample(new ForwardArbitrary(), {seed: seed, num_runs: l2});
                const lmin = Math.min(l1, l2);
                assert.deepEqual(out2.slice(0, lmin), out1.slice(0, lmin), 'Should be the same array');
            });
        });
        it('Should produce exactly the number of outputs', () => {
            fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
                const arb = new CounterArbitrary(start);
                const out = sample(arb, num);
                assert.equal(out.length, num, 'Should produce the right number of values');
                assert.deepEqual(out, arb.generatedValues, 'Should give back the values in order');
            });
        });
        it('Should produce exactly the number of outputs when called with number', () => {
            fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
                const arb = new CounterArbitrary(start);
                const out = sample(arb, num);
                assert.equal(out.length, num, 'Should produce the right number of values');
                assert.deepEqual(out, arb.generatedValues, 'Should give back the values in order');
            });
        });
    });
});
