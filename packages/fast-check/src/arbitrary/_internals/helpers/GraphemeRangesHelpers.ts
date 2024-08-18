import { GraphemeRange } from '../data/GraphemeRanges';

/** @internal */
const safeStringFromCodePoint = String.fromCodePoint;
/** @internal */
const safeMathMin = Math.min;

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
