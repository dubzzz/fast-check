import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { nat } from './nat';
import { set } from './set';
import { tuple } from './tuple';
import { maxLengthFromMinLength } from './_internals/helpers/MaxLengthFromMinLength';

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
}

/** @internal */
function extractMaxIndex(indexesAndValues: [number, unknown][]) {
  let maxIndex = -1;
  for (let index = 0; index !== indexesAndValues.length; ++index) {
    maxIndex = Math.max(maxIndex, indexesAndValues[index][0]);
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
    minNumElements = 0,
    maxNumElements = maxLengthFromMinLength(minNumElements),
    maxLength = Math.min(maxLengthFromMinLength(maxNumElements), 4294967295),
    noTrailingHole,
  } = constraints;

  if (minNumElements > maxLength) {
    throw new Error(`The minimal number of non-hole elements cannot be higher than the maximal length of the array`);
  }
  if (minNumElements > maxNumElements) {
    throw new Error(`The minimal number of non-hole elements cannot be higher than the maximal number of non-holes`);
  }

  const resultedMaxNumElements = Math.min(maxNumElements, maxLength);

  if (noTrailingHole) {
    const maxIndexAuthorized = Math.max(maxLength - 1, 0); // just preventing special case for maxLength=0
    return set(tuple(nat(maxIndexAuthorized), arb), {
      minLength: minNumElements,
      maxLength: resultedMaxNumElements,
      compare: (itemA, itemB) => itemA[0] === itemB[0],
    }).map((items) => {
      // When maxLength=0 (implies resultedMaxNumElements=0) we will have items=[] leading to lastIndex=-1
      // resulting in an empty array
      const lastIndex = extractMaxIndex(items);
      return arrayFromItems(lastIndex + 1, items);
    });
  }

  return set(tuple(nat(maxLength), arb), {
    minLength: minNumElements + 1,
    maxLength: resultedMaxNumElements + 1,
    compare: (itemA, itemB) => itemA[0] === itemB[0],
  }).map((items) => {
    // Item with the highest index is used as the length
    // for the resulting array
    const length = extractMaxIndex(items);
    return arrayFromItems(length, items);
  });
}
