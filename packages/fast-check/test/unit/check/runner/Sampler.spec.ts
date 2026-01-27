import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { sample, statistics } from '../../../../src/check/runner/Sampler.js';

import * as stubArb from '../../stubs/arbitraries.js';
import { noShrink } from '../../../../src/arbitrary/noShrink.js';
import { cloneMethod } from '../../../../src/check/symbols.js';
import { fakeArbitrary } from '../../arbitrary/__test-helpers__/ArbitraryHelpers.js';
import { Value } from '../../../../src/check/arbitrary/definition/Value.js';

const MAX_NUM_RUNS = 1000;
describe('Sampler', () => {
  describe('sample', () => {
    it('Should produce the same sequence given the same seed', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const out1 = sample(stubArb.forward(), { seed: seed });
          const out2 = sample(stubArb.forward(), { seed: seed });
          expect(out2).toEqual(out1);
        }),
      ));
    it('Should produce the same sequence given the same seed and different lengths', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(MAX_NUM_RUNS), fc.nat(MAX_NUM_RUNS), (seed, l1, l2) => {
          const out1 = sample(stubArb.forward(), { seed: seed, numRuns: l1 });
          const out2 = sample(stubArb.forward(), { seed: seed, numRuns: l2 });
          const lmin = Math.min(l1, l2);
          expect(out2.slice(0, lmin)).toEqual(out1.slice(0, lmin));
        }),
      ));
    it('Should produce exactly the number of outputs', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
          const arb = stubArb.counter(start);
          const out = sample(arb, num);
          expect(out).toHaveLength(num);
          expect(out).toEqual(arb.generatedValues.slice(0, num)); // give back the values in order
          // ::generate might have been called one time more than expected depending on its implementation
        }),
      ));
    it('Should produce exactly the number of outputs when called with number', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
          const arb = stubArb.counter(start);
          const out = sample(arb, num);
          expect(out).toHaveLength(num);
          expect(out).toEqual(arb.generatedValues.slice(0, num)); // give back the values in order
        }),
      ));
    it('Should not call arbitrary more times than the number of values required', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
          const arb = stubArb.counter(start);
          sample(arb, num);
          expect(arb.generatedValues).toHaveLength(num);
        }),
      ));
    it('Should throw on wrong path (too deep)', () => {
      const arb = noShrink(stubArb.forward());
      expect(() => sample(arb, { seed: 42, path: '0:0:0' })).toThrowError();
      // 0:1 should not throw but retrieve an empty set
    });
    it('Should throw on invalid path', () => {
      const arb = noShrink(stubArb.forward());
      expect(() => sample(arb, { seed: 42, path: 'invalid' })).toThrowError();
    });
    it('Should not call clone on cloneable instances', () => {
      const cloneable = {
        [cloneMethod]: () => {
          throw new Error('Unexpected call to [cloneMethod]');
        },
      };
      const { instance, generate } = fakeArbitrary();
      generate.mockReturnValue(new Value(cloneable, undefined));
      sample(instance, { seed: 42 });
    });
  });
  describe('statistics', () => {
    const customGen = (m = 7) => stubArb.forward().map((v) => ((v % m) + m) % m);
    const rePercent = /(\d+\.\d+)%$/;
    it('Should always produce for non null number of runs', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer({ min: 1, max: MAX_NUM_RUNS }), (seed, runs) => {
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, numRuns: runs, logger: (v: string) => logs.push(v) });
          expect(logs.length).not.toEqual(0); // at least one log
        }),
      ));
    it('Should produce the same statistics given the same seed', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const logs1: string[] = [];
          const logs2: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs1.push(v) });
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs2.push(v) });
          expect(logs2).toEqual(logs1);
        }),
      ));
    it('Should start log lines with labels', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const logs: string[] = [];
          const classify = (g: number) => `my_label_${g.toString()}!`;
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          for (const l of logs) {
            expect(l).toMatch(/^my_label_(\d+)!\.+\d+\.\d+%$/); // my_label_123!.....DD%
          }
        }),
      ));
    it('Should end log lines with percentage', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          for (const l of logs) {
            expect(l).toMatch(rePercent); // end by the measured percentage
          }
        }),
      ));
    it('Should sum to 100% when provided a single classifier', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          const extractedPercents = logs.map((l) => parseFloat(rePercent.exec(l)![1]));
          const lowerBound = extractedPercents.reduce((p, c) => p + c - 0.01);
          const upperBound = extractedPercents.reduce((p, c) => p + c + 0.01);
          expect(lowerBound).toBeLessThanOrEqual(100);
          expect(upperBound).toBeGreaterThanOrEqual(100);
        }),
      ));
    it('Should order percentages from the highest to the lowest', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          const extractedPercents = logs.map((l) => parseFloat(rePercent.exec(l)![1]));
          for (let idx = 1; idx < extractedPercents.length; ++idx) {
            expect(extractedPercents[idx - 1]).toBeGreaterThanOrEqual(extractedPercents[idx]);
          }
        }),
      ));
    it('Should be able to handle multiple classifiers', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const logs: string[] = [];
          const classify = (g: number) => (g % 2 === 0 ? [`a::${g}`, `b::${g}`, `c::${g}`] : [`a::${g}`, `b::${g}`]);
          statistics(customGen(), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          const extractedPercents = logs.map((l) => parseFloat(rePercent.exec(l)![1]));
          const lowerBound = extractedPercents.reduce((p, c) => p + c - 0.01);
          const upperBound = extractedPercents.reduce((p, c) => p + c + 0.01);
          expect(lowerBound).toBeLessThanOrEqual(300); // we always have a and b
          expect(upperBound).toBeGreaterThanOrEqual(200); // we can also have c
          const associatedWithA = logs
            .filter((l) => l.startsWith('a::'))
            .map((l) => l.slice(1))
            .sort();
          const associatedWithB = logs
            .filter((l) => l.startsWith('b::'))
            .map((l) => l.slice(1))
            .sort();
          expect(associatedWithB).toEqual(associatedWithA); // same logs for a:: and b::
        }),
      ));
    it('Should not produce more logs than the number of classified values', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer({ min: 1, max: 100 }), (seed, mod) => {
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          statistics(customGen(mod), classify, { seed: seed, logger: (v: string) => logs.push(v) });
          expect(logs.length).toBeGreaterThanOrEqual(1); // at least one log
          expect(logs.length).toBeLessThanOrEqual(mod); // aggregate classified values together
        }),
      ));
    it('Should not call arbitrary more times than the number of values required', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), (num, start) => {
          const classify = (g: number) => g.toString();
          const arb = stubArb.counter(start);
          statistics(arb, classify, { numRuns: num, logger: (_v: string) => {} });
          expect(arb.generatedValues).toHaveLength(num); // only call the arbitrary once per asked value
        }),
      ));
    it('Should return StatisticsReport with classes and count', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer({ min: 1, max: MAX_NUM_RUNS }), (seed, runs) => {
          const classify = (g: number) => g.toString();
          const report = statistics(customGen(), classify, { seed: seed, numRuns: runs, logger: (_v: string) => {} });
          expect(report).toHaveProperty('classes');
          expect(report).toHaveProperty('count');
          expect(report.count).toEqual(runs);
          expect(report.classes instanceof Map).toBe(true);
        }),
      ));
    it('Should return correct classification counts', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const classify = (g: number) => g.toString();
          const report = statistics(customGen(), classify, { seed: seed, logger: (_v: string) => {} });
          const totalCounts = Array.from(report.classes.values()).reduce((sum, count) => sum + count, 0);
          // For single classifications, total counts should equal count
          expect(totalCounts).toEqual(report.count);
        }),
      ));
    it('Should handle even/odd classifications', () => {
      const classify = (g: number) => (g % 2 === 0 ? 'even' : 'odd');
      const report = statistics(customGen(), classify, { numRuns: 100, logger: (_v: string) => {} });
      // All values should be classified as either even or odd
      const even = report.classes.get('even') || 0;
      const odd = report.classes.get('odd') || 0;
      expect(even + odd).toEqual(100);
    });
    it('Should handle multiple classifiers correctly in return value', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const classify = (g: number) => (g % 2 === 0 ? [`a::${g}`, `b::${g}`] : [`a::${g}`]);
          const report = statistics(customGen(), classify, { seed: seed, logger: (_v: string) => {} });
          // Total classifications should be more than count because some values have multiple classifications
          const totalCounts = Array.from(report.classes.values()).reduce((sum, count) => sum + count, 0);
          expect(totalCounts).toBeGreaterThanOrEqual(report.count);
        }),
      ));
    it('Should handle empty array classifications', () => {
      const classify = (g: number) => (g < 5 ? [] : 'classified'); // Skip values < 5
      const report = statistics(customGen(10), classify, { numRuns: 100, logger: (_v: string) => {} });
      // Values < 5 won't be classified
      const classified = report.classes.get('classified') || 0;
      expect(classified).toBeGreaterThan(0);
      expect(classified).toBeLessThan(100);
    });
  });
});
