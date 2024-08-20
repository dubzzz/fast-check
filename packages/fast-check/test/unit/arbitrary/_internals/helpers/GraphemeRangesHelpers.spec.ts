import { describe, it, expect } from 'vitest';
import {
  convertGraphemeRangeToMapToConstantEntry,
  intersectGraphemeRanges,
} from '../../../../../src/arbitrary/_internals/helpers/GraphemeRangesHelpers';
import type { GraphemeRange } from '../../../../../src/arbitrary/_internals/data/GraphemeRanges';
import * as fc from 'fast-check';

describe('convertGraphemeRangeToMapToConstantEntry', () => {
  it('should be able to deal with ranges made of a single value', () => {
    // Arrange
    const range: GraphemeRange = [0x32];

    // Act
    const entry = convertGraphemeRangeToMapToConstantEntry(range);

    // Assert
    expect(entry.num).toBe(1);
    expect(entry.build(0)).toBe('\u0032');
  });

  it('should be able to deal with ranges made of a single repeated value', () => {
    // Arrange
    const range: GraphemeRange = [0x48, 0x48];

    // Act
    const entry = convertGraphemeRangeToMapToConstantEntry(range);

    // Assert
    expect(entry.num).toBe(1);
    expect(entry.build(0)).toBe('\u0048');
  });

  it('should be able to deal with ranges made of a multiple values', () => {
    // Arrange
    const range: GraphemeRange = [0x48, 0x4a];

    // Act
    const entry = convertGraphemeRangeToMapToConstantEntry(range);

    // Assert
    expect(entry.num).toBe(3);
    expect(entry.build(0)).toBe('\u0048');
    expect(entry.build(1)).toBe('\u0049');
    expect(entry.build(2)).toBe('\u004a');
  });

  it('should support code-points not being single characters with ranges made of a single value', () => {
    // Arrange
    const range: GraphemeRange = [0x1f431];

    // Act
    const entry = convertGraphemeRangeToMapToConstantEntry(range);

    // Assert
    expect(entry.num).toBe(1);
    expect(entry.build(0)).toBe('\u{1f431}');
  });

  it('should support code-points not being single characters with ranges made of a multiple values', () => {
    // Arrange
    const range: GraphemeRange = [0x1f431, 0x1f434];

    // Act
    const entry = convertGraphemeRangeToMapToConstantEntry(range);

    // Assert
    expect(entry.num).toBe(4);
    expect(entry.build(0)).toBe('\u{1f431}');
    expect(entry.build(1)).toBe('\u{1f432}');
    expect(entry.build(2)).toBe('\u{1f433}');
    expect(entry.build(3)).toBe('\u{1f434}');
  });
});

describe('intersectGraphemeRanges', () => {
  it('should properly deal with ranges #1 strictly containing ranges #2', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[1, 6]];
    const rangesB: GraphemeRange[] = [[3, 4]];

    // Act
    const intersection = intersectGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(intersection).toStrictEqual([[3, 4]]);
  });

  it('should properly deal with ranges #1 not overlapping with ranges #2', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[1, 6]];
    const rangesB: GraphemeRange[] = [[8, 10]];

    // Act
    const intersection = intersectGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(intersection).toStrictEqual([]);
  });

  it('should properly deal with ranges #1 overlapping with ranges #2 only on their end', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[1, 6]];
    const rangesB: GraphemeRange[] = [[4, 10]];

    // Act
    const intersection = intersectGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(intersection).toStrictEqual([[4, 6]]);
  });

  it('should properly deal with ranges #1 overlapping with ranges #2 only on their start', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[4, 10]];
    const rangesB: GraphemeRange[] = [[1, 6]];

    // Act
    const intersection = intersectGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(intersection).toStrictEqual([[4, 6]]);
  });

  it('should properly deal with ranges #1 overlapping with ranges #2 on multiple points', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[1, 100]];
    const rangesB: GraphemeRange[] = [[10, 20], [30], [40, 50], [90, 110]];

    // Act
    const intersection = intersectGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(intersection).toStrictEqual([[10, 20], [30], [40, 50], [90, 100]]);
  });

  it('should properly intercept with self expressed differently with [number] instead of [number,number]', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[1], [2], [5, 6]];
    const rangesB: GraphemeRange[] = [[1, 2], [5], [6]];

    // Act
    const intersection = intersectGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(intersection).toStrictEqual([
      [1, 2],
      [5, 6],
    ]);
  });

  it('should properly intercept with self when self is made of contiguous ranges mixing both forms', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[0, 25], [26]];
    const rangesB: GraphemeRange[] = [[0, 25], [26]];

    // Act
    const intersection = intersectGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(intersection).toStrictEqual([[0, 26]]);
  });

  it('should intersect a range with a cloned version of itself to itself', () => {
    fc.assert(
      fc.property(
        fc.clone(orderedNonOverlappingAndNonContiguousGraphemeRangesArbitrary(), 2),
        ([ranges, clonedRanges]) => {
          // Arrange / Act
          const intersection = intersectGraphemeRanges(ranges, clonedRanges);

          // Assert
          expect(intersection).toStrictEqual(ranges);
        },
      ),
    );
  });

  it('should be a symmetrical operation', () => {
    fc.assert(
      fc.property(
        orderedNonOverlappingGraphemeRangesArbitrary(),
        orderedNonOverlappingGraphemeRangesArbitrary(),
        (rangesA, rangesB) => {
          // Arrange / Act
          const intersectionAB = intersectGraphemeRanges(rangesA, rangesB);
          const intersectionBA = intersectGraphemeRanges(rangesB, rangesA);

          // Assert
          expect(intersectionAB).toStrictEqual(intersectionBA);
        },
      ),
    );
  });

  it('should produce ordered ranges', () => {
    fc.assert(
      fc.property(
        orderedNonOverlappingGraphemeRangesArbitrary(),
        orderedNonOverlappingGraphemeRangesArbitrary(),
        (rangesA, rangesB) => {
          // Arrange / Act
          const intersection = intersectGraphemeRanges(rangesA, rangesB);

          // Assert
          const orderedIntersection = [...intersection].sort((ra, rb) => ra[0] - rb[0]);
          expect(intersection).toStrictEqual(orderedIntersection);
        },
      ),
    );
  });

  it('should produce non-overlapping and non-contiguous ranges', () => {
    fc.assert(
      fc.property(
        orderedNonOverlappingGraphemeRangesArbitrary(),
        orderedNonOverlappingGraphemeRangesArbitrary(),
        (rangesA, rangesB) => {
          // Arrange / Act
          const intersection = intersectGraphemeRanges(rangesA, rangesB);
          const orderedIntersection = [...intersection].sort((ra, rb) => ra[0] - rb[0]);

          // Assert
          for (let index = 1; index < orderedIntersection.length; ++index) {
            const rangePrevious = orderedIntersection[index - 1];
            const rangePreviousMax = rangePrevious.length === 1 ? rangePrevious[0] : rangePrevious[1];
            expect(rangePreviousMax).toBeLessThan(orderedIntersection[index][0]);
          }
        },
      ),
    );
  });

  it('should shrink isolated ranges made of 1 value into a [number] and otherwise range must be ordered (min<max)', () => {
    fc.assert(
      fc.property(
        orderedNonOverlappingGraphemeRangesArbitrary(),
        orderedNonOverlappingGraphemeRangesArbitrary(),
        (rangesA, rangesB) => {
          // Arrange / Act
          const intersection = intersectGraphemeRanges(rangesA, rangesB);

          // Assert
          for (const range of intersection) {
            if (range.length === 2) {
              expect(range[0]).toBeLessThan(range[1]);
            }
          }
        },
      ),
    );
  });
});

// Helpers

function graphemeRangeArbitrary() {
  return fc.tuple(fc.nat(), fc.nat()).map(([a, b]): GraphemeRange => (a === b ? [a] : a < b ? [a, b] : [b, a]));
}

function orderedNonOverlappingGraphemeRangesArbitrary() {
  return fc.array(graphemeRangeArbitrary()).map((ranges) => {
    if (ranges.length === 0) {
      return [];
    }
    const orderedRanges = [...ranges].sort((ra, rb) => ra[0] - rb[0]);
    const orderedNonOverlapping = [orderedRanges[0]];
    for (let index = 1; index !== orderedRanges.length; ++index) {
      const lastRange = orderedNonOverlapping[orderedNonOverlapping.length - 1];
      const lastRangeMax = lastRange.length === 1 ? lastRange[0] : lastRange[1];
      const range = orderedRanges[index];
      if (lastRangeMax < range[0]) {
        orderedNonOverlapping.push(range);
      }
    }
    return orderedNonOverlapping;
  });
}

function orderedNonOverlappingAndNonContiguousGraphemeRangesArbitrary() {
  return orderedNonOverlappingGraphemeRangesArbitrary().filter((ranges) => {
    for (let index = 1; index < ranges.length; ++index) {
      const rangePrevious = ranges[index - 1];
      const rangePreviousMax = rangePrevious.length === 1 ? rangePrevious[0] : rangePrevious[1];
      if (rangePreviousMax + 1 === ranges[index][0]) {
        return false; // ranges index-1 and index are contiguous
      }
    }
    return true;
  });
}
