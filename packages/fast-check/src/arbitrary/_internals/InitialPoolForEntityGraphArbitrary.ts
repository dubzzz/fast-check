import { array, type ArrayConstraints } from '../array.js';
import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { tuple } from '../tuple.js';
import { constant } from '../constant.js';
import { safeFlat, Error as SError } from '../../utils/globals.js';

type InitialPoolForEntityGraphConstraints<TEntityNames extends PropertyKey> = {
  [EntityName in TEntityNames]?: ArrayConstraints;
};

function canHaveAtLeastOneItem<TEntityNames extends PropertyKey>(
  keys: TEntityNames[],
  constraints: InitialPoolForEntityGraphConstraints<TEntityNames>,
): boolean {
  for (const key of keys) {
    const constraintsOnKey = constraints[key] || {};
    if (constraintsOnKey.maxLength === undefined || constraintsOnKey.maxLength > 0) {
      return true;
    }
  }
  return false;
}

/** @internal */
export function initialPoolForEntityGraph<TEntityNames extends PropertyKey>(
  keys: TEntityNames[],
  constraints: InitialPoolForEntityGraphConstraints<TEntityNames>,
): Arbitrary<TEntityNames[]> {
  if (keys.length === 0) {
    return constant([]);
  }

  if (!canHaveAtLeastOneItem(keys, constraints)) {
    throw new SError('Contraints on pool must accept at least one entity, maxLength cannot sum to 0');
  }
  const arbitraries: Arbitrary<TEntityNames[]>[] = keys.map((key) => array(constant(key), constraints[key]));

  return (
    tuple(...arbitraries)
      // While algorithmic-wise it could be great to reverse this mapping, from a usage point-of-view we don't care.
      // This arbitrary will stay internal and be only used to fuel a .chain and thus reversing it will not be useful.
      .map((values) => safeFlat(values))
      // For now, we restrict our checks on the length being >0.
      // We consider that breaching the length by having more than 4294967295 names is something that should be handled by the user.
      .filter((names) => names.length > 0)
  );
}
