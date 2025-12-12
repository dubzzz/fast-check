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
