import { safePop, safePush, safeSort } from '../../../utils/globals.js';
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

/**
 * Compute the union of the received ranges.
 * Contrary to the other operations, ranges can be received unordered and overlapping.
 * Produced ranges are ordered, non-overlapping and merged when contiguous.
 * @internal
 */
export function unionGraphemeRanges(ranges: GraphemeRange[]): GraphemeRange[] {
  const unionRanges: GraphemeRange[] = [];
  const sortedRanges = safeSort([...ranges], (rangeA, rangeB) => rangeA[0] - rangeB[0]);
  for (const range of sortedRanges) {
    const rangeMin = range[0];
    const rangeMax = range.length === 1 ? range[0] : range[1];
    if (unionRanges.length >= 1) {
      const lastRange = unionRanges[unionRanges.length - 1];
      const lastRangeMin = lastRange[0];
      const lastRangeMax = lastRange.length === 1 ? lastRange[0] : lastRange[1];
      if (rangeMin <= lastRangeMax + 1) {
        if (rangeMax > lastRangeMax) {
          unionRanges[unionRanges.length - 1] = [lastRangeMin, rangeMax];
        }
        continue;
      }
    }
    safePush(unionRanges, rangeMin === rangeMax ? [rangeMin] : [rangeMin, rangeMax]);
  }
  return unionRanges;
}

/**
 * Everything except the ranges, considering allowed values being the ones from 0 to MAX_SAFE_INTEGER
 * Ranges have to be ordered and non-overlapping
 * @internal
 */
function complementGraphemeRanges(ranges: GraphemeRange[]): GraphemeRange[] {
  const maxValue = Number.MAX_SAFE_INTEGER;
  const complementRanges: GraphemeRange[] = [];
  let nextMin = 0;
  for (const range of ranges) {
    const rangeMin = range[0];
    const rangeMax = range.length === 1 ? range[0] : range[1];
    if (rangeMin > nextMin) {
      safePush(complementRanges, rangeMin - 1 === nextMin ? [nextMin] : [nextMin, rangeMin - 1]);
    }
    nextMin = rangeMax + 1;
  }
  if (nextMin <= maxValue) {
    safePush(complementRanges, nextMin === maxValue ? [nextMin] : [nextMin, maxValue]);
  }
  return complementRanges;
}

/**
 * Compute rangesA minus rangesB: everything from rangesA not being part of rangesB
 * Ranges have to be ordered and non-overlapping
 * @internal
 */
export function subtractGraphemeRanges(rangesA: GraphemeRange[], rangesB: GraphemeRange[]): GraphemeRange[] {
  return intersectGraphemeRanges(rangesA, complementGraphemeRanges(rangesB));
}
