import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { mapToConstant } from '../mapToConstant';
import {
  asciiAlphabetRanges,
  autonomousDecomposableGraphemeRanges,
  autonomousGraphemeRanges,
  fullAlphabetRanges,
  GraphemeRange,
} from './data/GraphemeRanges';
import {
  convertGraphemeRangeToMapToConstantEntry,
  GraphemeRangeEntry,
  intersectGraphemeRanges,
} from './helpers/GraphemeRangesHelpers';

/** @internal */
type StringUnitType = 'grapheme' | 'simple-grapheme' | 'binary';
/** @internal */
type StringUnitAlphabet = 'full' | 'ascii';
/** @internal */
type StringUnitMapKey = `${StringUnitType}:${StringUnitAlphabet}`;

/**
 * Caching all already instanciated variations of stringUnit
 * @internal
 */
const registeredStringUnitInstancesMap = new Map<StringUnitMapKey, Arbitrary<string>>();

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
  const registered = registeredStringUnitInstancesMap.get(key);
  if (registered !== undefined) {
    return registered;
  }
  const alphabetRanges = getAlphabetRanges(alphabet);
  const ranges = type === 'binary' ? alphabetRanges : intersectGraphemeRanges(alphabetRanges, autonomousGraphemeRanges);
  const entries: GraphemeRangeEntry[] = [];
  for (const range of ranges) {
    entries.push(convertGraphemeRangeToMapToConstantEntry(range));
  }
  if (type === 'grapheme') {
    const decomposedRanges = intersectGraphemeRanges(alphabetRanges, autonomousDecomposableGraphemeRanges);
    for (const range of decomposedRanges) {
      const rawEntry = convertGraphemeRangeToMapToConstantEntry(range);
      entries.push({
        num: rawEntry.num,
        build: (idInGroup) => rawEntry.build(idInGroup).normalize('NFD'),
      });
    }
  }
  const stringUnitInstance = mapToConstant(...entries);
  registeredStringUnitInstancesMap.set(key, stringUnitInstance);
  return stringUnitInstance;
}

/** @internal */
export function stringUnit(type: StringUnitType, alphabet: StringUnitAlphabet): Arbitrary<string> {
  return getOrCreateStringUnitInstance(type, alphabet);
}
