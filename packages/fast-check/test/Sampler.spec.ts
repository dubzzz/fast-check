import { describe, it, expect, vi } from 'vitest';
import * as fc from '../src/fast-check.js';
import { seed } from './seed.js';

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

  const requestedNumRuns = 1_000;
  it.each([
    {
      behavior: 'ignore numRuns on predicate failure and exclude skipped inputs',
      noPredicateExecution: false,
      expectedLength: 3,
      expectedFirstValues: [[0], [2], [3]],
    },
    {
      behavior: 'honor numRuns when predicate execution is disabled',
      noPredicateExecution: true,
      expectedLength: requestedNumRuns,
      expectedFirstValues: [[0], [1], [2], [3], [4]],
    },
  ])('should $behavior', async ({ noPredicateExecution, expectedLength, expectedFirstValues }) => {
    const property = fc.property(fc.integer(), (value) => {
      fc.pre(value !== 1);
      return value !== 3;
    });

    const values = await fc.sample(property, {
      numRuns: requestedNumRuns,
      noPredicateExecution,
      examples: [[0], [1], [2], [3], [4]],
    });

    expect(values).toHaveLength(expectedLength);
    expect(values.slice(0, expectedFirstValues.length)).toEqual(expectedFirstValues);
  });

  it('should sample inputs without running the predicate when disabled', async () => {
    const predicate = vi.fn(() => false);

    const values = await fc.sample(fc.property(fc.integer(), predicate), {
      noPredicateExecution: true,
      numRuns: 3,
      examples: [[1], [2], [3]],
    });

    expect(values).toEqual([[1], [2], [3]]);
    expect(predicate).not.toHaveBeenCalled();
  });

  it('should not add a numRuns cap to shrink-path sampling', async () => {
    const arbitrary = fc.integer({ min: 0, max: 100 });
    const expected = Array.from(arbitrary.shrink(100, undefined), (value) => value.value);

    const values = await fc.sample(arbitrary, { numRuns: 1, examples: [100], path: '0:0' });

    expect(expected.length).toBeGreaterThan(1);
    expect(values).toEqual(expected);
  });

  describe('statistics', () => {
    it('should classify the property values collected by the runner', async () => {
      const property = fc.property(fc.integer(), async (value) => {
        fc.pre(value !== 1);
        return value !== 3;
      });

      const stats = await fc.statistics(property, (value) => String(value), {
        numRuns: 1_000,
        examples: [[0], [1], [2], [3], [4]],
      });

      expect(stats).toEqual({
        counts: new Map([
          ['0', 1],
          ['2', 1],
          ['3', 1],
        ]),
        numValues: 3,
      });
    });

    it('should classify the same values when given a property or its arbitrary without running the predicate', async () => {
      const arbitrary = fc.integer();
      const predicate = vi.fn(async () => false);

      const stats = await fc.statistics(fc.property(arbitrary, predicate), (value) => String(value), {
        seed,
        noPredicateExecution: true,
      });
      const expectedStats = await fc.statistics(arbitrary, String, { seed });

      expect(stats).toEqual(expectedStats);
      expect(predicate).not.toHaveBeenCalled();
    });

    it('should pass multiple property values as separate classifier arguments', async () => {
      const property = fc.property(fc.integer(), fc.string(), () => true);

      const stats = await fc.statistics(property, (value, label) => `${value}:${label}`, {
        numRuns: 3,
        examples: [
          [1, 'one'],
          [2, 'two'],
          [1, 'one'],
        ],
      });

      expect(stats).toEqual({
        counts: new Map([
          ['1:one', 2],
          ['2:two', 1],
        ]),
        numValues: 3,
      });
    });
  });
});
