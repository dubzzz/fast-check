import * as assert from 'power-assert';
import fc from '../../../../lib/fast-check';

import { sample, statistics } from '../../../../src/check/runner/Sampler';

import * as stubArb from '../../stubs/arbitraries';

const MAX_NUM_RUNS = 1000;
describe('Sampler', () => {
  describe('sample', () => {
    it('Should produce the same sequence given the same seed', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const out1 = sample(stubArb.forward(), { seed: seed });
          const out2 = sample(stubArb.forward(), { seed: seed });
          assert.deepEqual(out2, out1, 'Should be the same array');
        })
      ));
    it('Should produce the same sequence given the same seed and different lengths', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(MAX_NUM_RUNS), fc.nat(MAX_NUM_RUNS), (seed, l1, l2) => {
          const out1 = sample(stubArb.forward(), { seed: seed, num_runs: l1 });
          const out2 = sample(stubArb.forward(), { seed: seed, num_runs: l2 });
          const lmin = Math.min(l1, l2);
          assert.deepEqual(out2.slice(0, lmin), out1.slice(0, lmin), 'Should be the same array');
        })
      ));
    it('Should produce exactly the number of outputs', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
          const arb = stubArb.counter(start);
          const out = sample(arb, num);
          assert.equal(out.length, num, 'Should produce the right number of values');
          assert.deepEqual(out, arb.generatedValues.slice(0, num), 'Should give back the values in order');
          //::generate might have been called one time more than expected depending on its implementation
        })
      ));
    it('Should produce exactly the number of outputs when called with number', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
          const arb = stubArb.counter(start);
          const out = sample(arb, num);
          assert.equal(out.length, num, 'Should produce the right number of values');
          assert.deepEqual(out, arb.generatedValues.slice(0, num), 'Should give back the values in order');
        })
      ));
    it('Should not call arbitrary more times than the number of values required', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
          const arb = stubArb.counter(start);
          const out = sample(arb, num);
          assert.equal(arb.generatedValues.length, num, 'Should not call the arbitrary too many times');
        })
      ));
  });
  describe('statistics', () => {
    const customGen = (m: number = 7) => stubArb.forward().map(v => (v % m + m) % m);
    const reLabel = /^(.*[^.])\.+\d+\.\d+%$/;
    const rePercent = /(\d+\.\d+)%$/;
    it('Should always produce for non null number of runs', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(1, MAX_NUM_RUNS), (seed, runs) => {
          let logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, num_runs: runs, logger: (v: string) => logs.push(v) });
          assert.notEqual(logs.length, 0, 'Should not be empty');
        })
      ));
    it('Should produce the same statistics given the same seed', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          let logs1: string[] = [];
          let logs2: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs1.push(v) });
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs2.push(v) });
          assert.deepEqual(logs2, logs1, 'Should produce the same statistics');
        })
      ));
    it('Should start log lines with labels', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          let logs: string[] = [];
          const classify = (g: number) => `my_label_${g.toString()}!`;
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          for (const l of logs) {
            const m = reLabel.exec(l);
            assert.notEqual(m, null, `The log line '${l}' must start by the label (format: my_label_...!)`);
            assert.notStrictEqual(
              /^my_label_(\d+)!$/.exec(m[1]),
              null,
              `Label should have the format given by classifier: my_label_...!`
            );
          }
        })
      ));
    it('Should end log lines with percentage', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          let logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          for (const l of logs) {
            assert.notEqual(rePercent.exec(l), null, `The log line '${l}' must end by the measured percentage`);
          }
        })
      ));
    it('Should sum to 100% when provided a single classifier', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          let logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          const extractedPercents = logs.map(l => parseFloat(rePercent.exec(l)[1]));
          const lowerBound = extractedPercents.reduce((p, c) => p + c - 0.01);
          const upperBound = extractedPercents.reduce((p, c) => p + c + 0.01);
          assert.ok(lowerBound <= 100, `Lower bound should be lower than 100, got: ${lowerBound}`);
          assert.ok(upperBound >= 100, `Upper bound should be higher than 100, got: ${upperBound}`);
        })
      ));
    it('Should order percentages from the highest to the lowest', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          let logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          const extractedPercents = logs.map(l => parseFloat(rePercent.exec(l)[1]));
          for (var idx = 1; idx < extractedPercents.length; ++idx) {
            assert.ok(extractedPercents[idx - 1] >= extractedPercents[idx], 'Percentages should be ordered');
          }
        })
      ));
    it('Should be able to handle multiple classifiers', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          let logs: string[] = [];
          const classify = (g: number) => (g % 2 === 0 ? [`a::${g}`, `b::${g}`, `c::${g}`] : [`a::${g}`, `b::${g}`]);
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          const extractedPercents = logs.map(l => parseFloat(rePercent.exec(l)[1]));
          const lowerBound = extractedPercents.reduce((p, c) => p + c - 0.01);
          const upperBound = extractedPercents.reduce((p, c) => p + c + 0.01);
          assert.ok(lowerBound <= 300, `Lower bound should be lower than 300, got: ${lowerBound}`); // we always have a and b
          assert.ok(upperBound >= 200, `Upper bound should be higher than 200, got: ${upperBound}`); // we can also have c
          const associatedWithA = logs
            .filter(l => l.startsWith('a::'))
            .map(l => l.slice(1))
            .sort();
          const associatedWithB = logs
            .filter(l => l.startsWith('b::'))
            .map(l => l.slice(1))
            .sort();
          assert.deepEqual(associatedWithB, associatedWithA, 'Should have the same logs for a:: and b::');
        })
      ));
    it('Should not produce more logs than the number of classified values', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(1, 100), (seed, mod) => {
          let logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(mod), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          assert.ok(logs.length >= 1, 'Should always produce at least one log');
          assert.ok(logs.length <= mod, 'Should aggregate classified values together');
        })
      ));
    it('Should not call arbitrary more times than the number of values required', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
          const classify = (g: number) => g.toString();
          const arb = stubArb.counter(start);
          const out = statistics(arb, classify, { num_runs: num, logger: (v: string) => {} });
          assert.equal(arb.generatedValues.length, num, 'Should not call the arbitrary too many times');
        })
      ));
  });
});
