import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

import { sample, statistics, defaultStatisticsLogger } from './Sampler.js';

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
    it('Should return unrounded percentages without logging', async () => {
      const logger = vi.spyOn(console, 'log').mockImplementation(() => {});

      const stats = await statistics(stubArb.counter(0), (v) => (v === 0 ? 'first' : 'others'), { numRuns: 3 });

      expect(stats).toEqual(
        new Map([
          ['first', 100 / 3],
          ['others', 200 / 3],
        ]),
      );
      expect(logger).not.toHaveBeenCalled();
    });
    it('Should handle any string as a category', async () => {
      const categories = ['__proto__', 'constructor', 'toString', ''];

      const stats = await statistics(stubArb.counter(0), (v) => categories[v], { numRuns: categories.length });

      expect(stats).toEqual(new Map(categories.map((category) => [category, 25])));
    });
    it('Should include unclassified values in the total', async () => {
      const stats = await statistics(stubArb.counter(0), (v) => (v === 0 ? [] : ['a', 'b']), { numRuns: 4 });

      expect(stats).toEqual(
        new Map([
          ['a', 75],
          ['b', 75],
        ]),
      );
    });
    it('Should count each occurrence of a category', async () => {
      const stats = await statistics(stubArb.counter(0), () => ['a', 'a', 'b'], { numRuns: 4 });

      expect(stats).toEqual(
        new Map([
          ['a', 200],
          ['b', 100],
        ]),
      );
    });
    it('Should return an empty map when no values are sampled', async () => {
      const classify = vi.fn(() => 'value');

      expect(await statistics(stubArb.counter(0), classify, { numRuns: 0 })).toEqual(new Map());
      expect(classify).not.toHaveBeenCalled();
    });
    it('Should return an empty map when no categories are returned', async () => {
      expect(await statistics(stubArb.counter(0), () => [])).toEqual(new Map());
    });
    it.each(['invalid', '0:0:0'])('Should reject on invalid path %s', async (path) => {
      await expect(statistics(noShrink(stubArb.forward()), String, { seed: 42, path })).rejects.toThrowError();
    });
    it('Should always produce for non null number of runs', async () =>
      await fc.assert(
        fc.property(fc.integer(), fc.integer({ min: 1, max: MAX_NUM_RUNS }), async (seed, runs) => {
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          defaultStatisticsLogger(await statistics(customGen(), classify, { seed, numRuns: runs }), (v) =>
            logs.push(v),
          );
          expect(logs.length).not.toEqual(0); // at least one log
        }),
      ));
    it('Should produce the same statistics given the same seed', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const logs1: string[] = [];
          const logs2: string[] = [];
          const classify = (g: number) => g.toString();
          defaultStatisticsLogger(await statistics(customGen(), classify, { seed }), (v) => logs1.push(v));
          defaultStatisticsLogger(await statistics(customGen(), classify, { seed }), (v) => logs2.push(v));
          expect(logs2).toEqual(logs1);
        }),
      ));
    it('Should start log lines with labels', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const logs: string[] = [];
          const classify = (g: number) => `my_label_${g.toString()}!`;
          defaultStatisticsLogger(await statistics(customGen(), classify, { seed }), (v) => logs.push(v));
          for (const l of logs) {
            expect(l).toMatch(/^my_label_(\d+)!\.+\d+\.\d+%$/); // my_label_123!.....DD%
          }
        }),
      ));
    it('Should end log lines with percentage', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          defaultStatisticsLogger(await statistics(customGen(), classify, { seed }), (v) => logs.push(v));
          for (const l of logs) {
            expect(l).toMatch(rePercent); // end by the measured percentage
          }
        }),
      ));
    it('Should sum to 100% when provided a single classifier', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          defaultStatisticsLogger(await statistics(customGen(), classify, { seed }), (v) => logs.push(v));
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
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          defaultStatisticsLogger(await statistics(customGen(), classify, { seed }), (v) => logs.push(v));
          const extractedPercents = logs.map((l) => parseFloat(rePercent.exec(l)![1]));
          for (let idx = 1; idx < extractedPercents.length; ++idx) {
            expect(extractedPercents[idx - 1]).toBeGreaterThanOrEqual(extractedPercents[idx]);
          }
        }),
      ));
    it('Should be able to handle multiple classifiers', async () =>
      await fc.assert(
        fc.property(fc.integer(), async (seed) => {
          const logs: string[] = [];
          const classify = (g: number) => (g % 2 === 0 ? [`a::${g}`, `b::${g}`, `c::${g}`] : [`a::${g}`, `b::${g}`]);
          defaultStatisticsLogger(await statistics(customGen(), classify, { seed }), (v) => logs.push(v));
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
          const logs: string[] = [];
          const classify = (g: number) => g.toString();
          defaultStatisticsLogger(await statistics(customGen(mod), classify, { seed }), (v) => logs.push(v));
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
  describe('defaultStatisticsLogger', () => {
    it('Should sort, align and round percentages without changing the map', () => {
      const stats = new Map([
        ['longer', 100 / 3],
        ['x', 200 / 3],
        ['tiny', 0.004],
      ]);
      const original = [...stats];
      const logs: string[] = [];

      defaultStatisticsLogger(stats, (line) => logs.push(line));

      expect(logs).toEqual(['x.......66.67%', 'longer..33.33%', 'tiny.....0.00%']);
      expect([...stats]).toEqual(original);
    });
    it('Should preserve the order of categories with equal percentages', () => {
      const logs: string[] = [];

      defaultStatisticsLogger(
        new Map([
          ['b', 50],
          ['a', 50],
        ]),
        (line) => logs.push(line),
      );

      expect(logs).toEqual(['b..50.00%', 'a..50.00%']);
    });
    it('Should log to console.log by default', () => {
      const logger = vi.spyOn(console, 'log').mockImplementation(() => {});

      defaultStatisticsLogger(new Map([['all', 100]]));

      expect(logger).toHaveBeenCalledExactlyOnceWith('all..100.00%');
    });
    it('Should not log empty statistics', () => {
      const logger = vi.fn();

      defaultStatisticsLogger(new Map(), logger);

      expect(logger).not.toHaveBeenCalled();
    });
  });
});
