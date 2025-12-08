import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { array } from '../array';
import { record } from '../record';
import type { RecordConstraints } from '../record';
import type { Arbitraries, UnlinkedEntities } from './interfaces/EntityGraphTypes';

const safeObjectCreate = Object.create;

/** @internal */
export function unlinkedEntitiesForEntityGraph<TEntityFields>(
  arbitraries: Arbitraries<TEntityFields>,
  countFor: (entityName: keyof TEntityFields) => number,
  constraints: Omit<RecordConstraints, 'requiredKeys'>,
): Arbitrary<UnlinkedEntities<TEntityFields>> {
  const recordModel: { [K in keyof TEntityFields]: Arbitrary<TEntityFields[K][]> } = safeObjectCreate(null);
  for (const name in arbitraries) {
    const entityRecordModel = arbitraries[name];
    const count = countFor(name);
    recordModel[name] = array(record(entityRecordModel, constraints), {
      minLength: count,
      maxLength: count,
    }) as any;
  }
  // @ts-expect-error - We probably have a fishy typing issue in `record`, as we are supposed to produce `UnlinkedEntities<TEntityFields>`
  return record<UnlinkedEntities<TEntityFields>>(recordModel);
}
