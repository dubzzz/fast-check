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

  it('should sample a property until it fails, excluding skipped inputs', async () => {
    const property = fc.property(fc.integer(), (value) => {
      fc.pre(value !== 1);
      return value !== 3;
    });

    const values = await fc.sample(property, { numRuns: 4, examples: [[0], [1], [2], [3], [4]] });

    expect(values).toEqual([[0], [2], [3]]);
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
});
