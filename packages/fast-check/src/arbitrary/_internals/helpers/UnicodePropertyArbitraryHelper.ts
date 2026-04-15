import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safePush } from '../../../utils/globals.js';
import { mapToConstant } from '../../mapToConstant.js';
import type { GraphemeRange } from '../data/GraphemeRanges.js';
import type { GraphemeRangeEntry } from './GraphemeRangesHelpers.js';
import { complementGraphemeRanges, convertGraphemeRangeToMapToConstantEntry } from './GraphemeRangesHelpers.js';
import type { ResolvedUnicodeProperty } from './UnicodePropertyData.js';

/** @internal */
const safeStringFromCodePoint = String.fromCodePoint;

/** @internal */
const rangesCache: Record<string, GraphemeRange[]> = Object.create(null);

/**
 * Build the regex property spec string used to test individual code points.
 * E.g. "Letter", "Script=Latin", "Emoji"
 * @internal
 */
function getPropertySpec(astNode: ResolvedUnicodeProperty): string {
  if (astNode.binary || astNode.shorthand) {
    return astNode.canonicalValue;
  }
  return `${astNode.canonicalName}=${astNode.canonicalValue}`;
}

/**
 * Compute Unicode code point ranges matching a given property spec by testing
 * every valid code point against the JS regex engine. Results are cached.
 * @internal
 */
function getRangesForProperty(propertySpec: string): GraphemeRange[] {
  const cached = rangesCache[propertySpec];
  if (cached !== undefined) {
    return cached;
  }

  const regex = new RegExp(`^\\p{${propertySpec}}$`, 'u');
  const ranges: GraphemeRange[] = [];
  let rangeStart = -1;
  let rangeLast = -1;

  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    if (regex.test(safeStringFromCodePoint(cp))) {
      if (rangeStart === -1) {
        rangeStart = cp;
        rangeLast = cp;
      } else if (cp === rangeLast + 1) {
        rangeLast = cp;
      } else {
        ranges.push(rangeStart === rangeLast ? [rangeStart] : [rangeStart, rangeLast]);
        rangeStart = cp;
        rangeLast = cp;
      }
    }
  }
  if (rangeStart !== -1) {
    ranges.push(rangeStart === rangeLast ? [rangeStart] : [rangeStart, rangeLast]);
  }

  rangesCache[propertySpec] = ranges;
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
  const positiveRanges = getRangesForProperty(spec);
  const ranges = astNode.negative ? complementGraphemeRanges(positiveRanges) : positiveRanges;
  return rangesToArbitrary(ranges);
}
