import { maxLengthFromMinLength } from './ArrayArbitrary';
import { constant } from './ConstantArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { nat } from './IntegerArbitrary';
import { set } from './SetArbitrary';
import { tuple } from './TupleArbitrary';

/**
 * Constraints to be applied on {@link sparseArray}
 * @public
 */
export interface SparseArrayConstraints {
  /** Upper bound of the generated array size */
  maxLength?: number;
  /** Lower bound of the number of non-hole elements */
  minNumElements?: number;
  /** Upper bound of the number of non-hole elements */
  maxNumElements?: number;
  /** When enabled, all generated arrays will either be the empty array or end by a non-hole */
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
 * @public
 */
export function sparseArray<T>(arb: Arbitrary<T>, constraints: SparseArrayConstraints = {}): Arbitrary<T[]> {
  const {
    maxLength = 4294967295,
    minNumElements = 0,
    maxNumElements = maxLengthFromMinLength(minNumElements),
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
    if (maxLength === 0) {
      return constant([]);
    }
    return set(tuple(nat(maxLength - 1), arb), {
      minLength: minNumElements,
      maxLength: resultedMaxNumElements,
      compare: (itemA, itemB) => itemA[0] === itemB[0],
    }).map((items) => {
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
