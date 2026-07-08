import { describe, expect, it } from 'vitest';
import { appendRangesForRegex } from '../../../../../src/arbitrary/_internals/helpers/UnicodePropertyArbitraryHelper.js';
import type { GraphemeRange } from '../../../../../src/arbitrary/_internals/data/GraphemeRanges.js';

describe('appendRangesForRegex', () => {
  it.each([
    { regex: /^a$/u, expected: [[97]] }, // singleton range
    { regex: /^[a-z]$/u, expected: [[97, 122]] }, // single range
    {
      regex: /^[A-CU-Z]$/u, // multiple ranges
      expected: [
        [65, 67],
        [85, 90],
      ],
    },
    { regex: /^[a-ÿ]$/u, expected: [[97, 255]] }, // range hitting upper bound
  ])('should collect ranges matching the $regex', ({ regex, expected }) => {
    // Arrange
    const ranges: GraphemeRange[] = [];

    // Act
    appendRangesForRegex(regex, 0, 255, ranges);

    // Assert
    expect(ranges).toEqual(expected);
  });
});
