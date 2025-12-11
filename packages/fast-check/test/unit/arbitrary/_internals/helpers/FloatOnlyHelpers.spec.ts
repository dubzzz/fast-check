import { describe, it, expect } from 'vitest';
import {
  maxNonIntegerValue,
  onlyIntegersAfterThisValue,
} from '../../../../../src/arbitrary/_internals/helpers/FloatOnlyHelpers.js';
import { floatToIndex, indexToFloat } from '../../../../../src/arbitrary/_internals/helpers/FloatHelpers.js';

describe('maxNonIntegerValue', () => {
  it('should be immediately followed by an integer', () => {
    // Arrange / Act
    const next = nextFloat(maxNonIntegerValue);

    // Assert
    expect(Number.isInteger(next)).toBe(true);
  });

  it('should be followed by a number immediatelly followed by an integer', () => {
    // Arrange / Act
    const next = nextFloat(maxNonIntegerValue);
    const nextNext = nextFloat(next);

    // Assert
    expect(Number.isInteger(nextNext)).toBe(true);
  });

  it('should be immediately followed by onlyIntegersAfterThisValue', () => {
    // Arrange / Act / Assert
    expect(nextFloat(maxNonIntegerValue)).toBe(onlyIntegersAfterThisValue);
  });
});

// Helpers

function nextFloat(value: number): number {
  const index = floatToIndex(value);
  return indexToFloat(index + 1);
}
