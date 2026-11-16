import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

import { sample, statistics, logStatistics } from './Sampler.js';
import type { StatisticsResult } from './Sampler.js';

import * as stubArb from '../../__test-helpers__/arbitraries.js';
import { noShrink } from '../../arbitrary/noShrink.js';
import { cloneMethod } from '../symbols.js';
import { fakeArbitrary } from '../../arbitrary/__test-helpers__/ArbitraryHelpers.js';
import { Value } from '../arbitrary/definition/Value.js';

const MAX_NUM_RUNS = 1000;
describe('Sampler', () => {
  describe('sample', () => {
    it('Should produce the same sequence given the same seed', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const out1 = await sample(stubArb.forward(), { seed: seed });
          const out2 = await sample(stubArb.forward(), { seed: seed });
          expect(out2).toEqual(out1);
        }),
      ));
    it('Should produce the same sequence given the same seed and different lengths', async () =>
      await fc.assert(
        fc.property(fc.integer(), fc.nat(MAX_NUM_RUNS), fc.nat(MAX_NUM_RUNS), async (seed, l1, l2) => {
          const out1 = await sample(stubArb.forward(), { seed: seed, numRuns: l1 });
          const out2 = await sample(stubArb.forward(), { seed: seed, numRuns: l2 });
          const lmin = Math.min(l1, l2);
          expect(out2.slice(0, lmin)).toEqual(out1.slice(0, lmin));
        }),
      ));
    it('Should produce exactly the number of outputs', async () =>
      await fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), async (num, start) => {
          const arb = stubArb.counter(start);
          const out = await sample(arb, { numRuns: num });
          expect(out).toHaveLength(num);
          expect(out).toEqual(arb.generatedValues.slice(0, num)); // give back the values in order
          // ::generate might have been called one time more than expected depending on its implementation
        }),
      ));
    it('Should produce 100 outputs by default', async () => {
      const arb = stubArb.counter(0);
      const out = await sample(arb);
      expect(out).toHaveLength(100);
      expect(out).toEqual(arb.generatedValues);
    });
    it('Should not call arbitrary more times than the number of values required', async () =>
      await fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), async (num, start) => {
          const arb = stubArb.counter(start);
          await sample(arb, { numRuns: num });
          expect(arb.generatedValues).toHaveLength(num);
        }),
      ));
    it('Should reject on wrong path (too deep)', async () => {
      const arb = noShrink(stubArb.forward());
      await expect(sample(arb, { seed: 42, path: '0:0:0' })).rejects.toThrowError();
    });
    it('Should reject on invalid path', async () => {
      const arb = noShrink(stubArb.forward());
      await expect(sample(arb, { seed: 42, path: 'invalid' })).rejects.toThrowError();
    });
    it('Should not call clone on cloneable instances', async () => {
      const cloneable = {
        [cloneMethod]: () => {
          throw new Error('Unexpected call to [cloneMethod]');
        },
      };
      const { instance, generate } = fakeArbitrary();
      generate.mockReturnValue(new Value(cloneable, undefined));
      await sample(instance, { seed: 42 });
    });
  });
  describe('statistics', () => {
    const customGen = (m = 7) => stubArb.forward().map((v) => ((v % m) + m) % m);
    const rePercent = /(\d+\.\d+)%$/;
    it('Should always produce for non null number of runs', async () =>
      await fc.assert(
        fc.property(fc.integer(), fc.integer({ min: 1, max: MAX_NUM_RUNS }), async (seed, runs) => {
          const classify = (g: number) => g.toString();
          const stats = await statistics(customGen(), classify, { seed, numRuns: runs });
          expect(stats.counts.size).not.toEqual(0);
          expect(stats.numValues).toBe(runs);
        }),
      ));
    it('Should produce the same statistics given the same seed', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const classify = (g: number) => g.toString();
          const stats1 = await statistics(customGen(), classify, { seed });
          const stats2 = await statistics(customGen(), classify, { seed });
          expect(stats2).toEqual(stats1);
        }),
      ));
    it('Should start log lines with labels', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const classify = (g: number) => `my_label_${g.toString()}!`;
          const logs = captureStatisticsLogs(await statistics(customGen(), classify, { seed }));
          for (const l of logs) {
            expect(l).toMatch(/^my_label_(\d+)!\.+\d+\.\d+%$/); // my_label_123!.....DD%
          }
        }),
      ));
    it('Should end log lines with percentage', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const classify = (g: number) => g.toString();
          const logs = captureStatisticsLogs(await statistics(customGen(), classify, { seed }));
          for (const l of logs) {
            expect(l).toMatch(rePercent); // end by the measured percentage
          }
        }),
      ));
    it('Should sum to 100% when provided a single classifier', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const classify = (g: number) => g.toString();
          const logs = captureStatisticsLogs(await statistics(customGen(), classify, { seed }));
          const extractedPercents = logs.map((l) => parseFloat(rePercent.exec(l)![1]));
          const lowerBound = extractedPercents.reduce((p, c) => p + c - 0.01);
          const upperBound = extractedPercents.reduce((p, c) => p + c + 0.01);
          expect(lowerBound).toBeLessThanOrEqual(100);
          expect(upperBound).toBeGreaterThanOrEqual(100);
        }),
      ));
    it('Should order percentages from the highest to the lowest', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const classify = (g: number) => g.toString();
          const logs = captureStatisticsLogs(await statistics(customGen(), classify, { seed }));
          const extractedPercents = logs.map((l) => parseFloat(rePercent.exec(l)![1]));
          for (let idx = 1; idx < extractedPercents.length; ++idx) {
            expect(extractedPercents[idx - 1]).toBeGreaterThanOrEqual(extractedPercents[idx]);
          }
        }),
      ));
    it('Should be able to handle multiple classifiers', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const classify = (g: number) => (g % 2 === 0 ? [`a::${g}`, `b::${g}`, `c::${g}`] : [`a::${g}`, `b::${g}`]);
          const logs = captureStatisticsLogs(await statistics(customGen(), classify, { seed }));
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
    it('Should not produce more logs than the number of classified values', async () =>
      await fc.assert(
        fc.property(fc.integer(), fc.integer({ min: 1, max: 100 }), async (seed, mod) => {
          const classify = (g: number) => g.toString();
          const logs = captureStatisticsLogs(await statistics(customGen(mod), classify, { seed }));
          expect(logs.length).toBeGreaterThanOrEqual(1); // at least one log
          expect(logs.length).toBeLessThanOrEqual(mod); // aggregate classified values together
        }),
      ));
    it('Should not call arbitrary more times than the number of values required', async () =>
      await fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), fc.integer(), async (num, start) => {
          const classify = (g: number) => g.toString();
          const arb = stubArb.counter(start);
          await statistics(arb, classify, { numRuns: num });
          expect(arb.generatedValues).toHaveLength(num); // only call the arbitrary once per asked value
        }),
      ));
  });
  describe('logStatistics', () => {
    function captureStatisticsLogs(stats: StatisticsResult): string[] {
      const logs: string[] = [];
      logStatistics(stats, (line) => logs.push(line));
      return logs;
    }

    it('Should sort, align and round percentages', () => {
      const stats = {
        counts: new Map([
          ['longer', 10_000],
          ['x', 20_000],
          ['tiny', 1],
        ]),
        numValues: 30_000,
      };

      const logs = captureStatisticsLogs(stats);

      expect(logs).toEqual(['x.......66.67%', 'longer..33.33%', 'tiny.....0.00%']);
    });
    it('Should log to console.log', () => {
      const logger = vi.spyOn(console, 'log').mockImplementation(() => {});

      logStatistics({ counts: new Map([['all', 3]]), numValues: 3 });

      expect(logger).toHaveBeenCalledExactlyOnceWith('all..100.00%');
    });
  });
});
