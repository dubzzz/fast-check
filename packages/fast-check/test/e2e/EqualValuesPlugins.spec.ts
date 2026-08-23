import { describe, expect, it } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

describe(`EqualValuesPlugins (seed: ${seed})`, () => {
  it('should never run the predicate twice on the same value with the ignoreEqualValues plugin', () => {
    // Arrange
    const executions: number[] = [];

    // Act
    const out = fc.check(
      fc.property(fc.constant(0), (v) => {
        executions.push(v);
        return true;
      }),
      { plugins: [fc.ignoreEqualValues()] },
    );

    // Assert
    expect(out.failed).toBe(false);
    expect(executions).toEqual([0]); // only distinct values reach the predicate
  });

  it('should never run the predicate twice on the same value with the skipEqualValues plugin', () => {
    // Arrange
    const executions: number[] = [];

    // Act
    const out = fc.check(
      fc.property(fc.constant(0), (v) => {
        executions.push(v);
        return true;
      }),
      { plugins: [fc.skipEqualValues()] },
    );

    // Assert
    expect(out.failed).toBe(true); // duplicates get skipped: not enough distinct values to fulfill the run
    expect(executions).toEqual([0]); // only distinct values reach the predicate
  });
});
