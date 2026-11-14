import { describe, it, expect, vi } from 'vitest';
import * as fc from '../src/fast-check.js';
import { seed } from './seed.js';
import { readInstalledGlobalPlugins } from '../src/check/runner/configuration/GlobalPlugins.js';

describe(`Sampler (seed: ${seed})`, () => {
  it('should be able to sample an Arbitrary', async () => {
    // Arrange
    const numRuns = 42;

    // Act
    const values = await fc.sample(fc.integer(), { numRuns });

    // Assert
    expect(values).toHaveLength(numRuns);
    for (const value of values) {
      expect(typeof value).toBe('number');
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('should generate the same values when sampling a property or its arbitrary', async () => {
    // Arrange
    const numRuns = 42;
    const arbitrary = fc.integer();
    const property = fc.property(arbitrary, (_value) => true);

    // Act
    const values = await fc.sample(property, { seed, numRuns });
    const expectedValues = await fc.sample(arbitrary, { seed, numRuns });

    // Assert
    expect(values).toEqual(expectedValues.map((value) => [value]));
  });

  it('should generate the same values as assert', async () => {
    // Arrange
    const numRuns = 42;
    const arbitrary = fc.integer();
    const expectedValues: number[] = [];
    await fc.assert(
      fc.property(arbitrary, (value) => {
        expectedValues.push(value);
      }),
      { seed, numRuns },
    );

    // Act
    const values = await fc.sample(arbitrary, { seed, numRuns });

    // Assert
    expect(values).toEqual(expectedValues);
  });

  it('should include user-defined examples (as assert would do)', async () => {
    // Arrange
    const examples = [1, 2];

    // Act
    const values = await fc.sample(fc.constant(0), { numRuns: 4, examples });

    // Assert
    expect(values).toEqual([1, 2, 0, 0]);
  });

  describe('statistics', () => {
    it('should classify the same values when given a property or its arbitrary without running the predicate', async () => {
      const arbitrary = fc.integer();
      const predicate = vi.fn(async () => false);

      const stats = await fc.statistics(fc.property(arbitrary, predicate), ([value]) => String(value), { seed });
      const expectedStats = await fc.statistics(arbitrary, String, { seed });

      expect(stats).toEqual(expectedStats);
      expect(predicate).not.toHaveBeenCalled();
    });

    it('should classify user-defined examples', async () => {
      const stats = await fc.statistics(fc.constant(0), String, { numRuns: 4, examples: [1, 2] });

      expect(stats).toEqual(
        new Map([
          ['1', 25],
          ['2', 25],
          ['0', 50],
        ]),
      );
    });

    it('should await plugin hooks and classify values from decorated generators', async () => {
      const probes: string[] = [];
      const plugin: fc.Plugin<number> = () => ({
        beforeAll: async () => {
          await Promise.resolve();
          probes.push('beforeAll');
        },
        decorateGenerate: (generate) => (mrng, runId) => {
          expect(probes[0]).toBe('beforeAll');
          const value = generate(mrng, runId);
          return new fc.Value(value.value_ + 1, value.context);
        },
        decorateRun: (run) => async (value, context) => {
          await Promise.resolve();
          probes.push('run');
          return run(value, context);
        },
        onAllRunsComplete: async (details) => {
          await Promise.resolve();
          expect(details.numRuns).toBe(2);
          probes.push('complete');
        },
        afterAll: async () => {
          await Promise.resolve();
          probes.push('afterAll');
        },
      });

      const stats = await fc.statistics(fc.constant(0), String, { numRuns: 2, plugins: [plugin] });

      expect(stats).toEqual(new Map([['1', 100]]));
      expect(probes).toEqual(['beforeAll', 'run', 'run', 'complete', 'afterAll']);
    });

    it('should honor global plugins and noGlobalPlugins', async () => {
      const beforeAll = vi.fn();
      const plugins = readInstalledGlobalPlugins('pre');
      const originalLength = plugins.length;
      fc.installGlobalPlugin(() => ({ beforeAll }));
      try {
        await fc.statistics(fc.constant(0), String);
        await fc.statistics(fc.constant(0), String, { noGlobalPlugins: true });

        expect(beforeAll).toHaveBeenCalledOnce();
      } finally {
        plugins.splice(originalLength);
      }
    });

    it('should reject plugin setup failures and still clean up', async () => {
      const error = new Error('setup failed');
      const afterAll = vi.fn();
      const classify = vi.fn(String);
      const plugins: fc.Plugin<number>[] = [
        () => ({
          beforeAll: () => {
            throw error;
          },
          afterAll,
        }),
      ];

      await expect(fc.statistics(fc.constant(0), classify, { plugins })).rejects.toMatchObject({ cause: error });
      expect(classify).not.toHaveBeenCalled();
      expect(afterAll).toHaveBeenCalledOnce();
    });

    it('should calculate percentages from the values actually sampled before interruption', async () => {
      let numRuns = 0;
      const plugin: fc.Plugin<number> = () => ({
        decorateRun: (run) => (value, context) =>
          ++numRuns > 2 ? new fc.PreconditionFailure(true) : run(value, context),
      });

      const stats = await fc.statistics(fc.constant(0), String, { numRuns: 100, plugins: [plugin] });

      expect(stats).toEqual(new Map([['0', 100]]));
    });

    it('should report classifier errors through the runner and still clean up', async () => {
      const error = new Error('classification failed');
      const afterAll = vi.fn();

      await expect(
        fc.statistics(
          fc.constant(0),
          () => {
            throw error;
          },
          { plugins: [() => ({ afterAll })] },
        ),
      ).rejects.toMatchObject({ cause: error });
      expect(afterAll).toHaveBeenCalledOnce();
    });

    it.each([undefined, 1])('should classify shrink replay values with numRuns=%s', async (numRuns) => {
      const arbitrary = fc.integer({ min: 0, max: 100 });
      const params = { seed, path: '0:0', examples: [100], numRuns };
      const values = await fc.sample(arbitrary, params);
      const classified: number[] = [];

      const stats = await fc.statistics(
        arbitrary,
        (value) => {
          classified.push(value);
          return 'value';
        },
        params,
      );

      expect(values.length).toBeGreaterThan(0);
      if (numRuns !== undefined) expect(values).toHaveLength(numRuns);
      expect(classified).toEqual(values);
      expect(stats).toEqual(new Map([['value', 100]]));
    });
  });
});
