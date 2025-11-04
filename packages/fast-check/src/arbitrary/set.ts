import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { uniqueArray } from './uniqueArray';
import type { UniqueArraySharedConstraints } from './uniqueArray';
import { arrayToSetMapper, arrayToSetUnmapper } from './_internals/mappers/ArrayToSet';

/**
 * Constraints to be applied on {@link set}
 * @remarks Since 4.4.0
 * @public
 */
export type SetConstraints = UniqueArraySharedConstraints;

/**
 * For sets of values coming from `arb`
 *
 * All the values in the set are unique. Comparison of values relies on `SameValueZero`
 * which is the same comparison algorithm used by `Set`.
 *
 * @param arb - Arbitrary used to generate the values inside the set
 *
 * @remarks Since 4.4.0
 * @public
 */
export function set<T>(arb: Arbitrary<T>): Arbitrary<Set<T>>;
/**
 * For sets of values coming from `arb`
 *
 * All the values in the set are unique. Comparison of values relies on `SameValueZero`
 * which is the same comparison algorithm used by `Set`.
 *
 * @param arb - Arbitrary used to generate the values inside the set
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 4.4.0
 * @public
 */
export function set<T>(arb: Arbitrary<T>, constraints: SetConstraints): Arbitrary<Set<T>>;
export function set<T>(arb: Arbitrary<T>, constraints?: SetConstraints): Arbitrary<Set<T>> {
  return uniqueArray(arb, { ...constraints, comparator: 'SameValueZero' }).map(
    arrayToSetMapper,
    arrayToSetUnmapper,
  );
}
