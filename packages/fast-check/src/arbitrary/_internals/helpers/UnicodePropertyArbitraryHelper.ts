import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { Error, safePush } from '../../../utils/globals.js';
import { mapToConstant } from '../../mapToConstant.js';
import type { GraphemeRange } from '../data/GraphemeRanges.js';
import {
  lowercaseLetterRanges,
  modifierLetterRanges,
  otherLetterRanges,
  titlecaseLetterRanges,
  uppercaseLetterRanges,
} from '../data/UnicodeLetterRanges.js';
import type { GraphemeRangeEntry } from './GraphemeRangesHelpers.js';
import {
  complementGraphemeRanges,
  convertGraphemeRangeToMapToConstantEntry,
  unionGraphemeRanges,
} from './GraphemeRangesHelpers.js';
import type { ResolvedUnicodeProperty } from './UnicodePropertyData.js';

/** @internal */
const letterCategoryRangesCache: Record<string, GraphemeRange[]> = Object.create(null);

/** @internal */
function getLetterCategoryRanges(canonicalValue: string): GraphemeRange[] {
  const cached = letterCategoryRangesCache[canonicalValue];
  if (cached !== undefined) {
    return cached;
  }

  let ranges: GraphemeRange[];
  switch (canonicalValue) {
    case 'Uppercase_Letter':
      ranges = uppercaseLetterRanges;
      break;
    case 'Lowercase_Letter':
      ranges = lowercaseLetterRanges;
      break;
    case 'Titlecase_Letter':
      ranges = titlecaseLetterRanges;
      break;
    case 'Modifier_Letter':
      ranges = modifierLetterRanges;
      break;
    case 'Other_Letter':
      ranges = otherLetterRanges;
      break;
    case 'Letter':
      ranges = unionGraphemeRanges(
        uppercaseLetterRanges,
        lowercaseLetterRanges,
        titlecaseLetterRanges,
        modifierLetterRanges,
        otherLetterRanges,
      );
      break;
    case 'Cased_Letter':
      ranges = unionGraphemeRanges(uppercaseLetterRanges, lowercaseLetterRanges, titlecaseLetterRanges);
      break;
    default:
      throw new Error(
        `General_Category value "${canonicalValue}" is not yet supported in stringMatching. Only Letter subcategories (L, Lu, Ll, Lt, Lm, Lo, LC) are currently supported.`,
      );
  }

  letterCategoryRangesCache[canonicalValue] = ranges;
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
 * Currently only supports General_Category Letter subcategories.
 * @internal
 */
export function unicodePropertyArbitrary(astNode: ResolvedUnicodeProperty): Arbitrary<string> {
  if (astNode.canonicalName !== 'General_Category') {
    throw new Error(
      `Unicode property "${astNode.canonicalName}" is not yet supported in stringMatching. Only General_Category Letter subcategories are currently supported.`,
    );
  }

  const positiveRanges = getLetterCategoryRanges(astNode.canonicalValue);
  const ranges = astNode.negative ? complementGraphemeRanges(positiveRanges) : positiveRanges;
  return rangesToArbitrary(ranges);
}
