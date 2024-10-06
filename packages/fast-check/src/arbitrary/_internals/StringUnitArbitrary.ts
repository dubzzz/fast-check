import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Map, safeMap, safeNormalize, safePush } from '../../utils/globals';
import { integer } from '../integer';
import type { GraphemeRange } from './data/GraphemeRanges';
import {
  asciiAlphabetRanges,
  autonomousDecomposableGraphemeRanges,
  autonomousGraphemeRanges,
  fullAlphabetRanges,
} from './data/GraphemeRanges';
import { intersectGraphemeRanges } from './helpers/GraphemeRangesHelpers';

/** @internal */
type StringUnitType = 'grapheme' | 'composite' | 'binary';
/** @internal */
type StringUnitAlphabet = 'full' | 'ascii';
/** @internal */
type StringUnitMapKey = `${StringUnitType}:${StringUnitAlphabet}`;
/** @internal */
const safeStringFromCodePoint = String.fromCodePoint;

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
function buildStringUnit(valuesAtIndex: string[]): Arbitrary<string> {
  let reversedValuesAtIndex: Map<string, number> | undefined = undefined;
  return integer({ min: 0, max: valuesAtIndex.length - 1 }).map(
    (index) => valuesAtIndex[index],
    (possibleValue) => {
      if (typeof possibleValue !== 'string') {
        throw new Error('Can only unmap strings');
      }
      if (reversedValuesAtIndex === undefined) {
        reversedValuesAtIndex = new Map(safeMap(valuesAtIndex, (value, index) => [value, index]));
      }
      const reversedIndex = reversedValuesAtIndex.get(possibleValue);
      if (reversedIndex === undefined) {
        throw new Error('Can only unmap known values');
      }
      return reversedIndex;
    },
  );
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
  const valuesAtIndex: string[] = [];
  for (const range of ranges) {
    const start = range[0];
    const end = range.length === 1 ? start : range[1];
    for (let index = start; index <= end; ++index) {
      safePush(valuesAtIndex, safeStringFromCodePoint(index));
    }
  }
  if (type === 'grapheme') {
    const decomposedRanges = intersectGraphemeRanges(alphabetRanges, autonomousDecomposableGraphemeRanges);
    for (const range of decomposedRanges) {
      const start = range[0];
      const end = range.length === 1 ? start : range[1];
      for (let index = start; index <= end; ++index) {
        safePush(valuesAtIndex, safeNormalize(safeStringFromCodePoint(index), 'NFD'));
      }
    }
  }
  const stringUnitInstance = buildStringUnit(valuesAtIndex);
  registeredStringUnitInstancesMap[key] = stringUnitInstance;
  return stringUnitInstance;
}

/** @internal */
export function stringUnit(type: StringUnitType, alphabet: StringUnitAlphabet): Arbitrary<string> {
  return getOrCreateStringUnitInstance(type, alphabet);
}
