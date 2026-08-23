import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { mapToConstant } from '../mapToConstant.js';
import type { GraphemeRange } from './data/GraphemeRanges.js';
import {
  asciiAlphabetRanges,
  fullAlphabetRanges,
  getAutonomousDecomposableGraphemeRanges,
  getAutonomousGraphemeRanges,
} from './data/GraphemeRanges.js';
import type { GraphemeRangeEntry } from './helpers/GraphemeRangesHelpers.js';
import { convertGraphemeRangeToMapToConstantEntry, intersectGraphemeRanges } from './helpers/GraphemeRangesHelpers.js';

type StringUnitType = 'grapheme' | 'composite' | 'binary';
type StringUnitAlphabet = 'full' | 'ascii';
type StringUnitMapKey = `${StringUnitType}:${StringUnitAlphabet}`;

/**
 * Caching all already instanciated variations of stringUnit
 */
const registeredStringUnitInstancesMap: Partial<Record<StringUnitMapKey, Arbitrary<string>>> = Object.create(null);

function getAlphabetRanges(alphabet: StringUnitAlphabet): GraphemeRange[] {
  switch (alphabet) {
    case 'full':
      return fullAlphabetRanges;
    case 'ascii':
      return asciiAlphabetRanges;
  }
}

function getOrCreateStringUnitInstance(type: StringUnitType, alphabet: StringUnitAlphabet): Arbitrary<string> {
  const key: StringUnitMapKey = `${type}:${alphabet}`;
  const registered = registeredStringUnitInstancesMap[key];
  if (registered !== undefined) {
    return registered;
  }
  const alphabetRanges = getAlphabetRanges(alphabet);
  const ranges =
    type === 'binary' ? alphabetRanges : intersectGraphemeRanges(alphabetRanges, getAutonomousGraphemeRanges());
  const entries: GraphemeRangeEntry[] = [];
  for (const range of ranges) {
    entries.push(convertGraphemeRangeToMapToConstantEntry(range));
  }
  if (type === 'grapheme') {
    const decomposedRanges = intersectGraphemeRanges(alphabetRanges, getAutonomousDecomposableGraphemeRanges());
    for (const range of decomposedRanges) {
      const rawEntry = convertGraphemeRangeToMapToConstantEntry(range);
      entries.push({
        num: rawEntry.num,
        build: (idInGroup) => rawEntry.build(idInGroup).normalize('NFD'),
      });
    }
  }
  const stringUnitInstance = mapToConstant(...entries);
  registeredStringUnitInstancesMap[key] = stringUnitInstance;
  return stringUnitInstance;
}

export function stringUnit(type: StringUnitType, alphabet: StringUnitAlphabet): Arbitrary<string> {
  return getOrCreateStringUnitInstance(type, alphabet);
}
