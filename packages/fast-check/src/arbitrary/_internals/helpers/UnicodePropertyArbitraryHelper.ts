import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safeMap } from '../../../utils/globals.js';
import { mapToConstant } from '../../mapToConstant.js';
import type { GraphemeRange } from '../data/GraphemeRanges.js';
import { convertGraphemeRangeToMapToConstantEntry } from './GraphemeRangesHelpers.js';
import type { ResolvedUnicodeProperty } from './UnicodePropertyData.js';

/** @internal */
const safeStringFromCodePoint = String.fromCodePoint;

/** @internal */
function getPropertySpec(astNode: ResolvedUnicodeProperty): string {
  if (astNode.binary || astNode.shorthand) {
    return astNode.canonicalValue;
  }
  return `${astNode.canonicalName}=${astNode.canonicalValue}`;
}

/** @internal */
export function appendRangesForRegex(regex: RegExp, from: number, to: number, ranges: GraphemeRange[]): void {
  let currentRangeStart = -1;
  for (let cp = from; cp <= to; ++cp) {
    if (regex.test(safeStringFromCodePoint(cp))) {
      if (currentRangeStart === -1) {
        currentRangeStart = cp;
      }
    } else if (currentRangeStart !== -1) {
      const rangeEnd = cp - 1;
      ranges.push(currentRangeStart === rangeEnd ? [rangeEnd] : [currentRangeStart, rangeEnd]);
      currentRangeStart = -1;
    }
  }
  if (currentRangeStart !== -1) {
    ranges.push(currentRangeStart === to ? [to] : [currentRangeStart, to]);
  }
}

/** @internal */
function extractRangesForProperty(propertySpec: string, negative: boolean): GraphemeRange[] {
  const escape = negative ? 'P' : 'p';
  const regex = new RegExp(`^\\${escape}{${propertySpec}}$`, 'u');
  const ranges: GraphemeRange[] = [];
  appendRangesForRegex(regex, 0, 0xd7ff, ranges);
  appendRangesForRegex(regex, 0xe000, 0x10ffff, ranges);
  return ranges;
}

/** @internal */
const cache = new Map<string, GraphemeRange[]>();

/** @internal */
function extractRangesForPropertyOrFromCache(propertySpec: string, negative: boolean): GraphemeRange[] {
  const cacheKey = `${negative ? 'P' : 'p'}:${propertySpec}`;
  const cachedRanges = cache.get(cacheKey);
  if (cachedRanges !== undefined) {
    return cachedRanges;
  }
  const ranges = extractRangesForProperty(propertySpec, negative);
  cache.set(cacheKey, ranges);
  return ranges;
}

/**
 * Build an arbitrary producing characters matching a Unicode property (`\p{…}` / `\P{…}`).
 * @internal
 */
export function unicodePropertyArbitrary(astNode: ResolvedUnicodeProperty): Arbitrary<string> {
  const spec = getPropertySpec(astNode);
  const ranges = extractRangesForPropertyOrFromCache(spec, astNode.negative);
  const rangeEntries = safeMap(ranges, (range) => convertGraphemeRangeToMapToConstantEntry(range));
  return mapToConstant(...rangeEntries);
}
