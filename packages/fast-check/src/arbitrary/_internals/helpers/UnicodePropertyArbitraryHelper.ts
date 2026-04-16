import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safePush } from '../../../utils/globals.js';
import { mapToConstant } from '../../mapToConstant.js';
import type { GraphemeRange } from '../data/GraphemeRanges.js';
import type { GraphemeRangeEntry } from './GraphemeRangesHelpers.js';
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

/**
 * Compute Unicode code point ranges matching a given property spec by testing
 * every valid code point against the JS regex engine. Results are cached.
 * @internal
 */
function extractRangesForProperty(propertySpec: string): GraphemeRange[] {
  const regex = new RegExp(`^\\p{${propertySpec}}$`, 'u');
  const ranges: GraphemeRange[] = [];
  appendRangesForRegex(regex, 0, 0xd7ff, ranges);
  appendRangesForRegex(regex, 0xe000, 0x10ffff, ranges);
  return ranges;
}

/** @internal */
function rangesToArbitrary(ranges: GraphemeRange[]): Arbitrary<string> {
  const entries: GraphemeRangeEntry[] = [];
  for (const range of ranges) {
    safePush(entries, convertGraphemeRangeToMapToConstantEntry(range));
  }
  return mapToConstant(...entries);
}

/**
 * Build an arbitrary producing characters matching or not matching a Unicode property.
 * Supports any property that the JS regex engine handles with the `u` flag:
 * General_Category values, binary properties, Script, and Script_Extensions.
 * Ranges are computed lazily on first use and cached.
 * @internal
 */
export function unicodePropertyArbitrary(astNode: ResolvedUnicodeProperty): Arbitrary<string> {
  const spec = getPropertySpec(astNode);
  const positiveRanges = extractRangesForProperty(spec);
  if (astNode.negative) {
    throw new Error(`Negated UnicodeProperty not supported yet in stringMatching!`);
  }
  const ranges = positiveRanges;
  return rangesToArbitrary(ranges);
}
