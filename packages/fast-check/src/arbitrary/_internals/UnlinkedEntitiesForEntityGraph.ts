import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { array } from '../array.js';
import { record } from '../record.js';
import type { RecordConstraints } from '../record.js';
import type { UniqueArrayConstraintsRecommended } from '../uniqueArray.js';
import { uniqueArray } from '../uniqueArray.js';
import type { Arbitraries, UnlinkedEntities } from './interfaces/EntityGraphTypes.js';

export function unlinkedEntitiesForEntityGraph<TEntityFields>(
  arbitraries: Arbitraries<TEntityFields>,
  countFor: (entityName: keyof TEntityFields) => number,
  unicityConstraintsFor: <TEntityName extends keyof TEntityFields>(
    entityName: TEntityName,
  ) => UniqueArrayConstraintsRecommended<TEntityFields[TEntityName], unknown>['selector'],
  constraints: Omit<RecordConstraints, 'requiredKeys'>,
): Arbitrary<UnlinkedEntities<TEntityFields>> {
  const recordModel: { [K in keyof TEntityFields]: Arbitrary<TEntityFields[K][]> } = Object.create(null);
  for (const name in arbitraries) {
    const entityRecordModel = arbitraries[name];
    const entityArbitrary = record<TEntityFields[typeof name]>(entityRecordModel, constraints);
    const count = countFor(name);
    const unicityConstraints = unicityConstraintsFor(name);
    const arrayConstraints = { minLength: count, maxLength: count };
    recordModel[name] =
      unicityConstraints !== undefined
        ? uniqueArray(entityArbitrary, { ...arrayConstraints, selector: unicityConstraints })
        : array(entityArbitrary, arrayConstraints);
  }
  return record<UnlinkedEntities<TEntityFields>>(recordModel);
}
