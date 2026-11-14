import type { GraphemeRange } from '../data/GraphemeRanges.js';

type CodePointRange = { from: number; first: number; last: number };

function buildCodePointRanges(ranges: GraphemeRange[]): CodePointRange[] {
  let from = 0;
  const codePointRanges: CodePointRange[] = [];
  for (const range of ranges) {
    const first = range[0];
    const last = range.length === 1 ? range[0] : range[1];
    codePointRanges.push({ from, first, last });
    from += last - first + 1;
  }
  return codePointRanges;
}

function findCodePointRange(codePointRanges: CodePointRange[], codePoint: number): CodePointRange {
  let min = 0;
  let max = codePointRanges.length;
  while (max - min > 1) {
    const mid = ~~((min + max) / 2); // ~~ is Math.floor
    if (codePoint < codePointRanges[mid].first) {
      max = mid;
    } else {
      min = mid;
    }
  }
  return codePointRanges[min];
}

/**
 * Ranges have to be ordered and non-overlapping
 */
export function indexToCodePointRangesUnmapperFor(ranges: GraphemeRange[]): (value: unknown) => number {
  const codePointRanges = buildCodePointRanges(ranges);
  return function indexToCodePointRangesUnmapper(value: unknown): number {
    if (typeof value === 'string') {
      const codePoint = value.codePointAt(0);
      if (codePoint !== undefined && String.fromCodePoint(codePoint) === value) {
        const range = findCodePointRange(codePointRanges, codePoint);
        if (range.first <= codePoint && codePoint <= range.last) {
          return range.from + codePoint - range.first;
        }
      }
    }
    throw new Error('Unknown value encountered cannot be built using these code point ranges');
  };
}
