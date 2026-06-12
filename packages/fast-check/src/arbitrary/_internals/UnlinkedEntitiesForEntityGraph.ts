import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { safePush } from '../../utils/globals.js';
import { array } from '../array.js';
import { record } from '../record.js';
import type { RecordConstraints } from '../record.js';
import type { UniqueArrayConstraintsRecommended } from '../uniqueArray.js';
import { uniqueArray } from '../uniqueArray.js';
import type { Arbitraries, UnlinkedEntities } from './interfaces/EntityGraphTypes.js';

const safeObjectCreate = Object.create;

/** @internal */
type PerEntityTypeSetup<TEntityFields> = {
  name: Extract<keyof TEntityFields, string>;
  entityArbitrary: Arbitrary<TEntityFields[keyof TEntityFields]>;
  unicityConstraints: UniqueArrayConstraintsRecommended<TEntityFields[keyof TEntityFields], unknown>['selector'];
  // Cache of the arbitraries responsible to produce `count` entities of the type `name`.
  // Stored onto a null prototype object for fast and safe lookups on the hot path.
  arbitraryPerCount: Record<number, Arbitrary<TEntityFields[keyof TEntityFields][]> | undefined>;
};

/**
 * Prepare a builder of arbitraries producing the entities themselves (without any link).
 *
 * All the computations only depending on `arbitraries` and `constraints` (per entity type record
 * arbitraries and unicity selectors) are performed once at preparation time, so that the returned
 * builder can be invoked on every generation without paying for them again. Resulting arbitraries
 * are cached per requested counts (one count per entity type) as only the requested counts may
 * change across generations: they are fully shareable across generations as they are immutable.
 *
 * @internal
 */
export function unlinkedEntitiesForEntityGraph<TEntityFields>(
  arbitraries: Arbitraries<TEntityFields>,
  unicityConstraintsFor: <TEntityName extends keyof TEntityFields>(
    entityName: TEntityName,
  ) => UniqueArrayConstraintsRecommended<TEntityFields[TEntityName], unknown>['selector'],
  constraints: Omit<RecordConstraints, 'requiredKeys'>,
): (countFor: (entityName: keyof TEntityFields) => number) => Arbitrary<UnlinkedEntities<TEntityFields>> {
  const perEntityTypeSetups: PerEntityTypeSetup<TEntityFields>[] = [];
  for (const name in arbitraries) {
    const entityRecordModel = arbitraries[name];
    safePush(perEntityTypeSetups, {
      name,
      entityArbitrary: record(entityRecordModel, constraints) as Arbitrary<TEntityFields[keyof TEntityFields]>,
      unicityConstraints: unicityConstraintsFor(name),
      arbitraryPerCount: safeObjectCreate(null),
    });
  }
  const arbitraryPerCountsKey: Record<string, Arbitrary<UnlinkedEntities<TEntityFields>> | undefined> =
    safeObjectCreate(null);
  return (countFor) => {
    let countsKey = '';
    for (let index = 0; index !== perEntityTypeSetups.length; ++index) {
      countsKey += countFor(perEntityTypeSetups[index].name) + ',';
    }
    const cachedArbitrary = arbitraryPerCountsKey[countsKey];
    if (cachedArbitrary !== undefined) {
      return cachedArbitrary;
    }
    const recordModel: { [K in keyof TEntityFields]: Arbitrary<TEntityFields[K][]> } = safeObjectCreate(null);
    for (const { name, entityArbitrary, unicityConstraints, arbitraryPerCount } of perEntityTypeSetups) {
      const count = countFor(name);
      let entitiesArbitrary = arbitraryPerCount[count];
      if (entitiesArbitrary === undefined) {
        const arrayConstraints = { minLength: count, maxLength: count };
        entitiesArbitrary =
          unicityConstraints !== undefined
            ? (uniqueArray(entityArbitrary as any, { ...arrayConstraints, selector: unicityConstraints }) as any)
            : array(entityArbitrary, arrayConstraints);
        arbitraryPerCount[count] = entitiesArbitrary;
      }
      recordModel[name] = entitiesArbitrary as any;
    }
    // Note: We probably have a fishy typing issue in `record`, as we are supposed to produce `UnlinkedEntities<TEntityFields>`
    const unlinkedEntitiesArbitrary = record<UnlinkedEntities<TEntityFields>>(
      recordModel as { [K in keyof UnlinkedEntities<TEntityFields>]: Arbitrary<UnlinkedEntities<TEntityFields>[K]> },
    ) as unknown as Arbitrary<UnlinkedEntities<TEntityFields>>;
    arbitraryPerCountsKey[countsKey] = unlinkedEntitiesArbitrary;
    return unlinkedEntitiesArbitrary;
  };
}
