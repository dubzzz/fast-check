import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { safeMap, safeSlice } from '../utils/globals';
import { tuple } from './tuple';
import { uniqueArray } from './uniqueArray';
import { restrictedIntegerArbitraryBuilder } from './_internals/builders/RestrictedIntegerArbitraryBuilder';
import { DepthIdentifier } from './_internals/helpers/DepthContext';
import {
  maxGeneratedLengthFromSizeForArbitrary,
  MaxLengthUpperBound,
  SizeForArbitrary,
} from './_internals/helpers/MaxLengthFromMinLength';

const safeMathMin = Math.min;
const safeMathMax = Math.max;
const safeArrayIsArray = Array.isArray;
const safeObjectEntries = Object.entries;

/**
 * Constraints to be applied on {@link sparseArray}
 * @remarks Since 2.13.0
 * @public
 */
export interface SparseArrayConstraints {
  /**
   * Upper bound of the generated array size (maximal size: 4294967295)
   * @remarks Since 2.13.0
   */
  maxLength?: number;
  /**
   * Lower bound of the number of non-hole elements
   * @remarks Since 2.13.0
   */
  minNumElements?: number;
  /**
   * Upper bound of the number of non-hole elements
   * @remarks Since 2.13.0
   */
  maxNumElements?: number;
  /**
   * When enabled, all generated arrays will either be the empty array or end by a non-hole
   * @remarks Since 2.13.0
   */
  noTrailingHole?: boolean;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: SizeForArbitrary;
  /**
   * When receiving a depth identifier, the arbitrary will impact the depth
   * attached to it to avoid going too deep if it already generated lots of items.
   *
   * In other words, if the number of generated values within the collection is large
   * then the generated items will tend to be less deep to avoid creating structures a lot
   * larger than expected.
   *
   * For the moment, the depth is not taken into account to compute the number of items to
   * define for a precise generate call of the array. Just applied onto eligible items.
   *
   * @remarks Since 2.25.0
   */
  depthIdentifier?: DepthIdentifier | string;
}

/** @internal */
function extractMaxIndex(indexesAndValues: [number, unknown][]) {
  let maxIndex = -1;
  for (let index = 0; index !== indexesAndValues.length; ++index) {
    maxIndex = safeMathMax(maxIndex, indexesAndValues[index][0]);
  }
  return maxIndex;
}

/** @internal */
function arrayFromItems<T>(length: number, indexesAndValues: [number, T][]) {
  const array = Array<T>(length);
  for (let index = 0; index !== indexesAndValues.length; ++index) {
    const it = indexesAndValues[index];
    if (it[0] < length) array[it[0]] = it[1];
  }
  return array;
}

/**
 * For sparse arrays of values coming from `arb`
 * @param arb - Arbitrary used to generate the values inside the sparse array
 * @param constraints - Constraints to apply when building instances
 * @remarks Since 2.13.0
 * @public
 */
export function sparseArray<T>(arb: Arbitrary<T>, constraints: SparseArrayConstraints = {}): Arbitrary<T[]> {
  const {
    size,
    minNumElements = 0,
    maxLength = MaxLengthUpperBound,
    maxNumElements = maxLength, // cap maxNumElements to maxLength
    noTrailingHole,
    depthIdentifier,
  } = constraints;

  const maxGeneratedNumElements = maxGeneratedLengthFromSizeForArbitrary(
    size,
    minNumElements,
    maxNumElements,
    constraints.maxNumElements !== undefined
  );
  const maxGeneratedLength = maxGeneratedLengthFromSizeForArbitrary(
    size,
    maxGeneratedNumElements,
    maxLength,
    constraints.maxLength !== undefined
  );

  if (minNumElements > maxLength) {
    throw new Error(`The minimal number of non-hole elements cannot be higher than the maximal length of the array`);
  }
  if (minNumElements > maxNumElements) {
    throw new Error(`The minimal number of non-hole elements cannot be higher than the maximal number of non-holes`);
  }

  const resultedMaxNumElements = safeMathMin(maxNumElements, maxLength);
  const resultedSizeMaxNumElements = constraints.maxNumElements !== undefined || size !== undefined ? size : '=';

  const maxGeneratedIndexAuthorized = safeMathMax(maxGeneratedLength - 1, 0); // just preventing special case for maxGeneratedLength=0
  const maxIndexAuthorized = safeMathMax(maxLength - 1, 0); // just preventing special case for maxLength=0
  const sparseArrayNoTrailingHole = uniqueArray(
    tuple(restrictedIntegerArbitraryBuilder(0, maxGeneratedIndexAuthorized, maxIndexAuthorized), arb),
    {
      size: resultedSizeMaxNumElements,
      minLength: minNumElements,
      maxLength: resultedMaxNumElements,
      selector: (item) => item[0],
      depthIdentifier,
    }
  ).map(
    (items) => {
      // When maxLength=0 (implies resultedMaxNumElements=0) we will have items=[] leading to lastIndex=-1
      // resulting in an empty array
      const lastIndex = extractMaxIndex(items);
      return arrayFromItems(lastIndex + 1, items);
    },
    (value: unknown): [number, T][] => {
      if (!safeArrayIsArray(value)) {
        throw new Error('Not supported entry type');
      }
      if (noTrailingHole && value.length !== 0 && !(value.length - 1 in value)) {
        throw new Error('No trailing hole');
      }
      return safeMap(safeObjectEntries(value as T[]), (entry): [number, T] => [Number(entry[0]), entry[1]]);
    }
  );

  if (noTrailingHole || maxLength === minNumElements) {
    return sparseArrayNoTrailingHole;
  }

  return tuple(
    sparseArrayNoTrailingHole,
    restrictedIntegerArbitraryBuilder(minNumElements, maxGeneratedLength, maxLength)
  ).map(
    (data) => {
      const sparse = data[0];
      const targetLength = data[1];
      if (sparse.length >= targetLength) {
        return sparse;
      }
      const longerSparse = safeSlice(sparse);
      longerSparse.length = targetLength;
      return longerSparse;
    },
    (value: unknown): [T[], number] => {
      if (!safeArrayIsArray(value)) {
        throw new Error('Not supported entry type');
      }
      return [value, value.length];
    }
  );
}
