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

  it.each([false, true])('should run the predicate and exclude skipped values (async: %s)', async (isAsync) => {
    // Arrange
    const seen: number[] = [];
    const predicate = (value: number) => {
      seen.push(value);
      fc.pre(value % 2 === 0);
    };
    const property = fc.property(fc.integer(), isAsync ? async (value) => predicate(value) : predicate);

    // Act
    const values = await fc.sample(property, { numRuns: 2, examples: [[1], [2], [3], [4]] });

    // Assert
    expect(values).toEqual([[2], [4]]);
    expect(seen).toEqual([1, 2, 3, 4]);
  });

  it.each([
    { name: 'returning false', fail: () => false },
    {
      name: 'throwing',
      fail: () => {
        throw new Error('failure');
      },
    },
    { name: 'resolving to false', fail: async () => false },
    {
      name: 'rejecting',
      fail: async () => {
        throw new Error('failure');
      },
    },
  ])('should interrupt without shrinking when the predicate fails by $name', async ({ fail }) => {
    // Arrange
    const seen: number[] = [];
    const property = fc.property(fc.integer(), (value) => {
      seen.push(value);
      return value === 2 ? fail() : true;
    });
    const shrink = vi.spyOn(property, 'shrink');
    const onAllRunsComplete = vi.fn();

    // Act
    const values = await fc.sample(property, {
      numRuns: 3,
      examples: [[1], [2], [3]],
      plugins: [() => ({ onAllRunsComplete })],
    });

    // Assert
    expect(values).toEqual([[1], [2]]);
    expect(seen).toEqual([1, 2]);
    expect(shrink).not.toHaveBeenCalled();
    expect(onAllRunsComplete).toHaveBeenCalledWith(expect.objectContaining({ failed: false, interrupted: true }));
  });

  it.each([false, true])('should forward skips and interrupts unchanged (async: %s)', async (isAsync) => {
    // Arrange
    const skip = new fc.PreconditionFailure();
    const interrupt = new fc.PreconditionFailure(true);
    const examples: [number][] = [[1], [2], [3], [4]];
    const predicate = (value: number) => {
      if (value === 1) throw skip;
      if (value === 3) throw interrupt;
    };
    const property = fc.property(fc.integer(), isAsync ? async (value) => predicate(value) : predicate);
    const outcomes: unknown[] = [];
    const observer: fc.Plugin<[number]> = () => ({
      decorateRun: (nestedRun) => async (value, context) => {
        const out = await nestedRun(value, context);
        outcomes.push(out);
        return out;
      },
    });

    // Act
    const values = await fc.sample(property, { numRuns: 4, examples, plugins: [observer] });

    // Assert
    expect(values).toEqual([[2]]);
    expect(outcomes).toHaveLength(3);
    expect(outcomes[0]).toBe(skip);
    expect(outcomes[1]).toBeNull();
    expect(outcomes[2]).toBe(interrupt);
  });

  it('should keep the runner skip limit', async () => {
    const property = fc.property(fc.integer(), () => fc.pre(false));

    await expect(fc.sample(property, { numRuns: 1, maxSkipsPerRun: 1 })).rejects.toThrow(
      'too many pre-condition failures',
    );
  });

  it('should pass the plugin execution context to the predicate', async () => {
    // Arrange
    const context = { signal: new AbortController().signal };
    const predicate = vi.fn(() => true);
    const plugin: fc.Plugin<[number]> = () => ({
      decorateRun: (nestedRun) => (value) => nestedRun(value, context),
    });

    // Act
    await fc.sample(fc.property(fc.constant(42), predicate), { numRuns: 1, plugins: [plugin] });

    // Assert
    expect(predicate).toHaveBeenCalledExactlyOnceWith(42, context);
  });

  it('should only skip the predicate when noPredicateExecution is enabled', async () => {
    // Arrange
    const predicate = vi.fn(() => false);
    const beforeEach = vi.fn();
    const afterEach = vi.fn();

    // Act
    const values = await fc.sample(fc.property(fc.integer(), predicate), {
      noPredicateExecution: true,
      numRuns: 3,
      examples: [[1], [2], [3]],
      plugins: [fc.beforeEach(beforeEach), fc.afterEach(afterEach)],
    });

    // Assert
    expect(values).toEqual([[1], [2], [3]]);
    expect(predicate).not.toHaveBeenCalled();
    expect(beforeEach).toHaveBeenCalledTimes(3);
    expect(afterEach).toHaveBeenCalledTimes(3);
  });

  it('should execute the predicate when noPredicateExecution is false', async () => {
    const property = fc.property(fc.constant(42), () => false);

    expect(await fc.sample(property, { numRuns: 3, noPredicateExecution: false })).toEqual([[42]]);
  });

  it('should exclude values skipped by plugins', async () => {
    const values = await fc.sample(
      fc.property(fc.integer(), () => true),
      {
        numRuns: 3,
        examples: [[1], [1], [2], [2], [3]],
        plugins: [fc.skipEqualValues()],
      },
    );

    expect(values).toEqual([[1], [2], [3]]);
  });

  it('should replay shrink candidates until the predicate fails', async () => {
    const property = fc.property(fc.integer({ min: 0, max: 100 }), (value) => value !== 50);

    const values = await fc.sample(property, { numRuns: 1, examples: [[100]], path: '0:0' });

    expect(values).toEqual([[0], [50]]);
  });

  it('should not add a numRuns cap to shrink-path sampling', async () => {
    const arbitrary = fc.integer({ min: 0, max: 100 });
    const expected = Array.from(arbitrary.shrink(100, undefined), (value) => value.value);

    const values = await fc.sample(arbitrary, { numRuns: 1, examples: [100], path: '0:0' });

    expect(expected.length).toBeGreaterThan(1);
    expect(values).toEqual(expected);
  });
});
