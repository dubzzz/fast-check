import { describe, it, expect } from 'vitest';
import {
  convertGraphemeRangeToMapToConstantEntry,
  intersectGraphemeRanges,
  subtractGraphemeRanges,
  unionGraphemeRanges,
} from '../../../../../src/arbitrary/_internals/helpers/GraphemeRangesHelpers.js';
import type { GraphemeRange } from '../../../../../src/arbitrary/_internals/data/GraphemeRanges.js';
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

describe('unionGraphemeRanges', () => {
  it('should merge overlapping ranges together', () => {
    // Arrange
    const ranges: GraphemeRange[] = [
      [1, 6],
      [3, 10],
    ];

    // Act
    const union = unionGraphemeRanges(ranges);

    // Assert
    expect(union).toStrictEqual([[1, 10]]);
  });

  it('should merge contiguous ranges together', () => {
    // Arrange
    const ranges: GraphemeRange[] = [[1, 3], [4], [10, 12]];

    // Act
    const union = unionGraphemeRanges(ranges);

    // Assert
    expect(union).toStrictEqual([
      [1, 4],
      [10, 12],
    ]);
  });

  it('should re-order unordered ranges', () => {
    // Arrange
    const ranges: GraphemeRange[] = [[10, 12], [1, 2], [5]];

    // Act
    const union = unionGraphemeRanges(ranges);

    // Assert
    expect(union).toStrictEqual([[1, 2], [5], [10, 12]]);
  });

  it('should drop duplicated ranges and normalize ranges made of a single repeated value into [number]', () => {
    // Arrange
    const ranges: GraphemeRange[] = [[5, 5], [5], [5, 5]];

    // Act
    const union = unionGraphemeRanges(ranges);

    // Assert
    expect(union).toStrictEqual([[5]]);
  });

  it('should be equivalent to the union of the underlying sets of values', () => {
    fc.assert(
      fc.property(fc.array(graphemeRangeArbitrary(MaxValueForSetBasedChecks)), (ranges) => {
        // Arrange / Act
        const union = unionGraphemeRanges(ranges);

        // Assert
        const expectedValues = new Set(ranges.flatMap(expandRange));
        expect(new Set(union.flatMap(expandRange))).toStrictEqual(expectedValues);
      }),
    );
  });

  it('should produce ordered, non-overlapping and non-contiguous ranges with isolated values as [number]', () => {
    fc.assert(
      fc.property(fc.array(graphemeRangeArbitrary()), (ranges) => {
        // Arrange / Act
        const union = unionGraphemeRanges(ranges);

        // Assert
        assertOrderedNonOverlappingNonContiguousNormalizedRanges(union);
      }),
    );
  });

  it('should keep already normalized ranges unchanged', () => {
    fc.assert(
      fc.property(orderedNonOverlappingAndNonContiguousGraphemeRangesArbitrary(), (ranges) => {
        // Arrange / Act
        const union = unionGraphemeRanges(ranges);

        // Assert
        expect(union).toStrictEqual(ranges);
      }),
    );
  });

  it('should not depend on the order of the received ranges', () => {
    fc.assert(
      fc.property(fc.array(graphemeRangeArbitrary()), fc.array(graphemeRangeArbitrary()), (rangesA, rangesB) => {
        // Arrange / Act
        const unionAB = unionGraphemeRanges([...rangesA, ...rangesB]);
        const unionBA = unionGraphemeRanges([...rangesB, ...rangesA]);

        // Assert
        expect(unionAB).toStrictEqual(unionBA);
      }),
    );
  });
});

describe('subtractGraphemeRanges', () => {
  it('should split ranges #1 when ranges #2 fall strictly inside of them', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[1, 10]];
    const rangesB: GraphemeRange[] = [[4, 6]];

    // Act
    const subtraction = subtractGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(subtraction).toStrictEqual([
      [1, 3],
      [7, 10],
    ]);
  });

  it('should keep ranges #1 fully when not overlapping with ranges #2', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[1, 3], [7]];
    const rangesB: GraphemeRange[] = [[5, 6], [12]];

    // Act
    const subtraction = subtractGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(subtraction).toStrictEqual([[1, 3], [7]]);
  });

  it('should drop ranges #1 fully contained inside ranges #2', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[3, 4], [8]];
    const rangesB: GraphemeRange[] = [[1, 10]];

    // Act
    const subtraction = subtractGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(subtraction).toStrictEqual([]);
  });

  it('should crop ranges #1 when ranges #2 overlap with their edges', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[1, 10]];
    const rangesB: GraphemeRange[] = [
      [0, 2],
      [9, 12],
    ];

    // Act
    const subtraction = subtractGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(subtraction).toStrictEqual([[3, 8]]);
  });

  it('should normalize remaining ranges made of a single value into [number]', () => {
    // Arrange
    const rangesA: GraphemeRange[] = [[1, 3]];
    const rangesB: GraphemeRange[] = [[2, 3]];

    // Act
    const subtraction = subtractGraphemeRanges(rangesA, rangesB);

    // Assert
    expect(subtraction).toStrictEqual([[1]]);
  });

  it('should be equivalent to the difference of the underlying sets of values', () => {
    fc.assert(
      fc.property(
        orderedNonOverlappingGraphemeRangesArbitrary(MaxValueForSetBasedChecks),
        orderedNonOverlappingGraphemeRangesArbitrary(MaxValueForSetBasedChecks),
        (rangesA, rangesB) => {
          // Arrange / Act
          const subtraction = subtractGraphemeRanges(rangesA, rangesB);

          // Assert
          const valuesB = new Set(rangesB.flatMap(expandRange));
          const expectedValues = new Set(rangesA.flatMap(expandRange).filter((value) => !valuesB.has(value)));
          expect(new Set(subtraction.flatMap(expandRange))).toStrictEqual(expectedValues);
        },
      ),
    );
  });

  it('should keep ranges unchanged when subtracting empty ranges', () => {
    fc.assert(
      fc.property(orderedNonOverlappingAndNonContiguousGraphemeRangesArbitrary(), (ranges) => {
        // Arrange / Act
        const subtraction = subtractGraphemeRanges(ranges, []);

        // Assert
        expect(subtraction).toStrictEqual(ranges);
      }),
    );
  });

  it('should produce no range when subtracting ranges from a cloned version of themselves', () => {
    fc.assert(
      fc.property(fc.clone(orderedNonOverlappingGraphemeRangesArbitrary(), 2), ([ranges, clonedRanges]) => {
        // Arrange / Act
        const subtraction = subtractGraphemeRanges(ranges, clonedRanges);

        // Assert
        expect(subtraction).toStrictEqual([]);
      }),
    );
  });

  it('should produce ordered, non-overlapping and non-contiguous ranges with isolated values as [number]', () => {
    fc.assert(
      fc.property(
        orderedNonOverlappingGraphemeRangesArbitrary(),
        orderedNonOverlappingGraphemeRangesArbitrary(),
        (rangesA, rangesB) => {
          // Arrange / Act
          const subtraction = subtractGraphemeRanges(rangesA, rangesB);

          // Assert
          assertOrderedNonOverlappingNonContiguousNormalizedRanges(subtraction);
        },
      ),
    );
  });
});

// Helpers

const MaxValueForSetBasedChecks = 100;

function expandRange(range: GraphemeRange): number[] {
  const max = range.length === 1 ? range[0] : range[1];
  const values: number[] = [];
  for (let value = range[0]; value <= max; ++value) {
    values.push(value);
  }
  return values;
}

function assertOrderedNonOverlappingNonContiguousNormalizedRanges(ranges: GraphemeRange[]): void {
  for (let index = 0; index < ranges.length; ++index) {
    const range = ranges[index];
    if (range.length === 2) {
      expect(range[0]).toBeLessThan(range[1]);
    }
    if (index > 0) {
      const rangePrevious = ranges[index - 1];
      const rangePreviousMax = rangePrevious.length === 1 ? rangePrevious[0] : rangePrevious[1];
      expect(rangePreviousMax + 1).toBeLessThan(range[0]);
    }
  }
}

function graphemeRangeArbitrary(maxValue?: number) {
  const natArbitrary = maxValue !== undefined ? fc.nat({ max: maxValue }) : fc.nat();
  return fc.tuple(natArbitrary, natArbitrary).map(([a, b]): GraphemeRange => (a === b ? [a] : a < b ? [a, b] : [b, a]));
}

function orderedNonOverlappingGraphemeRangesArbitrary(maxValue?: number) {
  return fc.array(graphemeRangeArbitrary(maxValue)).map((ranges) => {
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
