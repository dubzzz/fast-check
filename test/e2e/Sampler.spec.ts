import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`Sampler (seed: ${seed})`, () => {
  it('should be able to sample an Arbitrary', () => {
    // Arrange
    const numRuns = 42;

    // Act
    const values = fc.sample(fc.integer(), { numRuns });

    // Assert
    expect(values).toHaveLength(numRuns);
    for (const value of values) {
      expect(typeof value).toBe('number');
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('should be able to sample a synchronous property', () => {
    // Arrange
    const numRuns = 42;

    // Act
    const values = fc.sample(
      fc.property(fc.integer(), (_ignored) => true),
      { numRuns }
    );

    // Assert
    expect(values).toHaveLength(numRuns);
    for (const [value] of values) {
      expect(typeof value).toBe('number');
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('should be able to sample an asynchronous property', () => {
    // Arrange
    const numRuns = 42;

    // Act
    const values = fc.sample(
      fc.asyncProperty(fc.integer(), async (_ignored) => true),
      { numRuns }
    );

    // Assert
    expect(values).toHaveLength(numRuns);
    for (const [value] of values) {
      expect(typeof value).toBe('number');
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});
