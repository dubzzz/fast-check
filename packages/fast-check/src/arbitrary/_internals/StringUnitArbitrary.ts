import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { safeNormalize, safePush } from '../../utils/globals';
import { mapToConstant } from '../mapToConstant';
import type { GraphemeRange } from './data/GraphemeRanges';
import {
  asciiAlphabetRanges,
  autonomousDecomposableGraphemeRanges,
  autonomousGraphemeRanges,
  fullAlphabetRanges,
} from './data/GraphemeRanges';
import type { GraphemeRangeEntry } from './helpers/GraphemeRangesHelpers';
import { convertGraphemeRangeToMapToConstantEntry, intersectGraphemeRanges } from './helpers/GraphemeRangesHelpers';

/** @internal */
type StringUnitType = 'grapheme' | 'composite' | 'binary';
/** @internal */
type StringUnitAlphabet = 'full' | 'ascii';
/** @internal */
type StringUnitMapKey = `${StringUnitType}:${StringUnitAlphabet}`;

/**
 * Caching all already instanciated variations of stringUnit
 * @internal
 */
const registeredStringUnitInstancesMap: Partial<Record<StringUnitMapKey, Arbitrary<string>>> = Object.create(null);

/** @internal */
function getAlphabetRanges(alphabet: StringUnitAlphabet): GraphemeRange[] {
  switch (alphabet) {
    case 'full':
      return fullAlphabetRanges;
    case 'ascii':
      return asciiAlphabetRanges;
  }
}

/** @internal */
function getOrCreateStringUnitInstance(type: StringUnitType, alphabet: StringUnitAlphabet): Arbitrary<string> {
  const key: StringUnitMapKey = `${type}:${alphabet}`;
  const registered = registeredStringUnitInstancesMap[key];
  if (registered !== undefined) {
    return registered;
  }
  const alphabetRanges = getAlphabetRanges(alphabet);
  const ranges = type === 'binary' ? alphabetRanges : intersectGraphemeRanges(alphabetRanges, autonomousGraphemeRanges);
  const entries: GraphemeRangeEntry[] = [];
  for (const range of ranges) {
    safePush(entries, convertGraphemeRangeToMapToConstantEntry(range));
  }
  if (type === 'grapheme') {
    const decomposedRanges = intersectGraphemeRanges(alphabetRanges, autonomousDecomposableGraphemeRanges);
    for (const range of decomposedRanges) {
      const rawEntry = convertGraphemeRangeToMapToConstantEntry(range);
      safePush(entries, {
        num: rawEntry.num,
        build: (idInGroup) => safeNormalize(rawEntry.build(idInGroup), 'NFD'),
      });
    }
  }
  const stringUnitInstance = mapToConstant(...entries);
  registeredStringUnitInstancesMap[key] = stringUnitInstance;
  return stringUnitInstance;
}

/** @internal */
export function stringUnit(type: StringUnitType, alphabet: StringUnitAlphabet): Arbitrary<string> {
  return getOrCreateStringUnitInstance(type, alphabet);
}
