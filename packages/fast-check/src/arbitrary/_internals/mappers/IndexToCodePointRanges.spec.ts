import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { indexToCodePointRangesUnmapperFor } from './IndexToCodePointRanges.js';
import { indexToMappedConstantUnmapperFor } from './IndexToMappedConstant.js';
import { convertGraphemeRangeToMapToConstantEntry } from '../helpers/GraphemeRangesHelpers.js';
import type { GraphemeRange } from '../data/GraphemeRanges.js';
import { fullAlphabetRanges } from '../data/GraphemeRanges.js';

const ranges: GraphemeRange[] = [[0x41, 0x43], [0x61], [0xd7ff, 0xe000], [0x1f600, 0x1f601]];

describe('indexToCodePointRangesUnmapperFor', () => {
  it.each`
    index        | value
    ${0}         | ${'A'}
    ${2}         | ${'C'}
    ${3}         | ${'a'}
    ${4}         | ${'\u{d7ff}'}
    ${5}         | ${'\u{d800}'}
    ${6 + 0x7ff} | ${'\u{e000}'}
    ${8 + 0x7ff} | ${'😁'}
  `('should properly unmap value $value to index $index', ({ index, value }) => {
    // Arrange / Act
    const computedIndex = indexToCodePointRangesUnmapperFor(ranges)(value);

    // Assert
    expect(computedIndex).toBe(index);
  });

  it.each`
    value
    ${'@'}
    ${'D'}
    ${'b'}
    ${'\u{e001}'}
    ${'😂'}
    ${''}
    ${'AB'}
    ${'😀A'}
    ${0x41}
    ${undefined}
  `('should reject $value', ({ value }) => {
    // Arrange
    const unmapper = indexToCodePointRangesUnmapperFor(ranges);

    // Act / Assert
    expect(() => unmapper(value)).toThrowError();
  });

  it('should reject a lone surrogate outside of the ranges', () => {
    // Arrange
    const unmapper = indexToCodePointRangesUnmapperFor(fullAlphabetRanges);

    // Act / Assert
    expect(() => unmapper('\u{d800}')).toThrowError();
    expect(() => unmapper('\u{dfff}')).toThrowError();
  });
});

describe('indexToCodePointRangesUnmapperFor (equivalence)', () => {
  // Small window: mapToConstant's unmapper enumerates every value
  const windowSize = 0x1000;
  const windowArbitrary = fc.integer({ min: 0, max: 0x10ffff - windowSize });
  const rangesArbitrary = fc
    .tuple(windowArbitrary, fc.uniqueArray(fc.nat({ max: windowSize }), { minLength: 1, maxLength: 20 }))
    .map(([windowStart, offsets]) => {
      const sorted = offsets.map((offset) => windowStart + offset).sort((a, b) => a - b);
      const ranges: GraphemeRange[] = [];
      for (let index = 0; index < sorted.length; index += 2) {
        ranges.push(index + 1 < sorted.length ? [sorted[index], sorted[index + 1]] : [sorted[index]]);
      }
      return ranges;
    });
  const unmapOrUndefined = (unmapper: (value: unknown) => number, value: unknown) => {
    try {
      return unmapper(value);
    } catch {
      return undefined;
    }
  };

  it('should unmap as mapToConstant does on the entries of the same ranges', () => {
    fc.assert(
      fc.property(rangesArbitrary, fc.nat({ max: windowSize + 1 }), (ranges, codePointOffset) => {
        // Arrange
        const entries = ranges.map(convertGraphemeRangeToMapToConstantEntry);
        // Around the window, so that values just outside of the ranges get checked too
        const value = String.fromCodePoint(Math.min(Math.max(ranges[0][0] - 1 + codePointOffset, 0), 0x10ffff));

        // Act
        const unmapped = unmapOrUndefined(indexToCodePointRangesUnmapperFor(ranges), value);

        // Assert
        expect(unmapped).toBe(unmapOrUndefined(indexToMappedConstantUnmapperFor(entries), value));
      }),
    );
  });
});
