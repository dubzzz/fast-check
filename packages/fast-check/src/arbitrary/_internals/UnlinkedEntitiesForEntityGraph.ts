import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { array } from '../array';
import { record } from '../record';
import type { RecordConstraints } from '../record';
import type { UniqueArrayConstraintsRecommended } from '../uniqueArray';
import { uniqueArray } from '../uniqueArray';
import type { Arbitraries, UnlinkedEntities } from './interfaces/EntityGraphTypes';

const safeObjectCreate = Object.create;

/** @internal */
export function unlinkedEntitiesForEntityGraph<TEntityFields>(
  arbitraries: Arbitraries<TEntityFields>,
  countFor: (entityName: keyof TEntityFields) => number,
  unicityConstraintsFor: <TEntityName extends keyof TEntityFields>(
    entityName: TEntityName,
  ) => UniqueArrayConstraintsRecommended<TEntityFields[TEntityName], unknown>['selector'],
  constraints: Omit<RecordConstraints, 'requiredKeys'>,
): Arbitrary<UnlinkedEntities<TEntityFields>> {
  const recordModel: { [K in keyof TEntityFields]: Arbitrary<TEntityFields[K][]> } = safeObjectCreate(null);
  for (const name in arbitraries) {
    const entityRecordModel = arbitraries[name];
    const entityArbitrary = record(entityRecordModel, constraints);
    const count = countFor(name);
    const unicityConstraints = unicityConstraintsFor(name);
    const arrayConstraints = { minLength: count, maxLength: count };
    recordModel[name] =
      unicityConstraints !== undefined
        ? (uniqueArray(entityArbitrary as any, { ...arrayConstraints, selector: unicityConstraints }) as any)
        : (array(entityArbitrary, arrayConstraints) as any);
  }
  // @ts-expect-error - We probably have a fishy typing issue in `record`, as we are supposed to produce `UnlinkedEntities<TEntityFields>`
  return record<UnlinkedEntities<TEntityFields>>(recordModel);
}
