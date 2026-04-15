import { safePop, safePush } from '../../../utils/globals.js';
import type { GraphemeRange } from '../data/GraphemeRanges.js';

/** @internal */
const safeStringFromCodePoint = String.fromCodePoint;
/** @internal */
const safeMathMin = Math.min;
/** @internal */
const safeMathMax = Math.max;

/** @internal */
export type GraphemeRangeEntry = { num: number; build: (idInGroup: number) => string };

/**
 * Convert a range into an entry for mapToConstant
 * @internal
 */
export function convertGraphemeRangeToMapToConstantEntry(range: GraphemeRange): GraphemeRangeEntry {
  if (range.length === 1) {
    const codePointString = safeStringFromCodePoint(range[0]);
    return { num: 1, build: () => codePointString };
  }
  const rangeStart = range[0];
  return { num: range[1] - range[0] + 1, build: (idInGroup) => safeStringFromCodePoint(rangeStart + idInGroup) };
}

/**
 * Merge multiple sorted, non-overlapping range arrays into a single sorted, non-overlapping array.
 * Input arrays must each be sorted and non-overlapping; they may overlap between each other.
 * @internal
 */
export function unionGraphemeRanges(...allRanges: GraphemeRange[][]): GraphemeRange[] {
  const flat: GraphemeRange[] = [];
  for (let i = 0; i < allRanges.length; ++i) {
    for (let j = 0; j < allRanges[i].length; ++j) {
      safePush(flat, allRanges[i][j]);
    }
  }
  flat.sort((a, b) => a[0] - b[0]);

  const merged: GraphemeRange[] = [];
  for (let i = 0; i < flat.length; ++i) {
    const cur = flat[i];
    const curMin = cur[0];
    const curMax = cur.length === 1 ? cur[0] : cur[1];
    if (merged.length === 0) {
      safePush(merged, curMin === curMax ? [curMin] : [curMin, curMax]);
    } else {
      const last = merged[merged.length - 1];
      const lastMax = last.length === 1 ? last[0] : last[1];
      if (curMin <= lastMax + 1) {
        const newMax = safeMathMax(lastMax, curMax);
        safePop(merged);
        safePush(merged, last[0] === newMax ? [last[0]] : [last[0], newMax]);
      } else {
        safePush(merged, curMin === curMax ? [curMin] : [curMin, curMax]);
      }
    }
  }
  return merged;
}

/**
 * Compute the complement of sorted, non-overlapping ranges within a given universe.
 * Universe is the set of all valid code points: [0x0000, 0xD7FF] and [0xE000, 0x10FFFF].
 * @internal
 */
export function complementGraphemeRanges(ranges: GraphemeRange[]): GraphemeRange[] {
  const universeSegments: [number, number][] = [
    [0x0000, 0xd7ff],
    [0xe000, 0x10ffff],
  ];
  const result: GraphemeRange[] = [];
  let rangeIdx = 0;

  for (let s = 0; s < universeSegments.length; ++s) {
    let cursor = universeSegments[s][0];
    const segEnd = universeSegments[s][1];

    while (cursor <= segEnd) {
      if (rangeIdx >= ranges.length) {
        safePush(result, cursor === segEnd ? [cursor] : [cursor, segEnd]);
        cursor = segEnd + 1;
        break;
      }
      const range = ranges[rangeIdx];
      const rMin = range[0];
      const rMax = range.length === 1 ? range[0] : range[1];

      if (rMax < cursor) {
        rangeIdx++;
        continue;
      }
      if (rMin > segEnd) {
        safePush(result, cursor === segEnd ? [cursor] : [cursor, segEnd]);
        cursor = segEnd + 1;
        break;
      }

      // There is a gap before this range starts
      if (rMin > cursor) {
        const gapEnd = safeMathMin(rMin - 1, segEnd);
        safePush(result, cursor === gapEnd ? [cursor] : [cursor, gapEnd]);
      }

      cursor = rMax + 1;
      rangeIdx++;
    }
  }
  return result;
}

/**
 * Ranges have to be ordered and non-overlapping
 * @internal
 */
export function intersectGraphemeRanges(rangesA: GraphemeRange[], rangesB: GraphemeRange[]): GraphemeRange[] {
  const mergedRanges: GraphemeRange[] = [];
  let cursorA = 0;
  let cursorB = 0;
  while (cursorA < rangesA.length && cursorB < rangesB.length) {
    const rangeA = rangesA[cursorA];
    const rangeAMin = rangeA[0];
    const rangeAMax = rangeA.length === 1 ? rangeA[0] : rangeA[1];
    const rangeB = rangesB[cursorB];
    const rangeBMin = rangeB[0];
    const rangeBMax = rangeB.length === 1 ? rangeB[0] : rangeB[1];
    if (rangeAMax < rangeBMin) {
      cursorA += 1;
    } else if (rangeBMax < rangeAMin) {
      cursorB += 1;
    } else {
      // rangeAMax >= rangeBMin and rangeBMax >= rangeAMin
      // so the range intersect
      // With rangeAMin <= rangeBMin:
      // A:   |          |
      // B:        |        |
      // A:   |          |
      // B:        |   |
      // Otherwise:
      // A:            | |
      // B:        |        |
      // A:            |         |
      // B:        |        |
      let min = safeMathMax(rangeAMin, rangeBMin);
      const max = safeMathMin(rangeAMax, rangeBMax);
      if (mergedRanges.length >= 1) {
        const lastMergedRange = mergedRanges[mergedRanges.length - 1];
        const lastMergedRangeMax = lastMergedRange.length === 1 ? lastMergedRange[0] : lastMergedRange[1];
        if (lastMergedRangeMax + 1 === min) {
          min = lastMergedRange[0];
          safePop(mergedRanges);
        }
      }
      safePush(mergedRanges, min === max ? [min] : [min, max]);
      if (rangeAMax <= max) {
        cursorA += 1;
      }
      if (rangeBMax <= max) {
        cursorB += 1;
      }
    }
  }
  return mergedRanges;
}
