import { StringRange } from '../data/StringRanges';

/** @internal */
const safeStringFromCodePoint = String.fromCodePoint;

/** @internal */
export type StringRangeEntry = { num: number; build: (idInGroup: number) => string };

/**
 * Convert a range into an entry for mapToConstant
 * @internal
 */
export function convertStringRangeToMapToConstantEntry(range: StringRange): StringRangeEntry {
  if (range.length === 1) {
    const codePointString = safeStringFromCodePoint(range[0]);
    return { num: 1, build: () => codePointString };
  }
  const rangeStart = range[0];
  return { num: range[1] - range[0] + 1, build: (idInGroup) => safeStringFromCodePoint(rangeStart + idInGroup) };
}
