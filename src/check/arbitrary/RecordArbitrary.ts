import Random from '../../random/generator/Random';
import Arbitrary from './definition/Arbitrary';

import { option } from './OptionArbitrary';
import { genericTuple } from './TupleArbitrary';

export interface RecordConstraints {
  /** Allow to remove keys from the generated record */
  withDeletedKeys?: boolean;

  /** @depreciated Prefer withDeletedKeys */
  with_deleted_keys?: boolean;
}

/** @internalapi */
function rawRecord<T>(recordModel: { [key: string]: Arbitrary<T> }): Arbitrary<{ [key: string]: T }> {
  const keys = Object.keys(recordModel);
  const arbs: Arbitrary<T>[] = keys.map(v => recordModel[v]);
  return genericTuple(arbs).map((gs: T[]) => {
    const obj: { [key: string]: T } = {};
    for (let idx = 0; idx !== keys.length; ++idx) obj[keys[idx]] = gs[idx];
    return obj;
  });
}

/**
 * Arbitrary producing a record following the `recordModel` schema
 *
 * @example
 * ```typescript
 * record({ x: someArbitraryInt, y: someArbitraryInt }): Arbitrary<{x:number,y:number}>
 * // merge two integer arbitraries to produce a {x, y} record
 * ```
 *
 * @param recordModel Schema of the record
 */
function record<T>(recordModel: { [key: string]: Arbitrary<T> }): Arbitrary<{ [key: string]: T }>;
/**
 * Arbitrary producing a record following the `recordModel` schema
 *
 * @example
 * ```typescript
 * record({ x: someArbitraryInt, y: someArbitraryInt }, {withDeletedKeys: true}): Arbitrary<{x?:number,y?:number}>
 * // merge two integer arbitraries to produce a {x, y} record or {X}, {y} or just {}
 * ```
 *
 * @param recordModel Schema of the record
 * @param constraints Contraints on the generated record
 */
function record<T>(
  recordModel: { [key: string]: Arbitrary<T> },
  constraints: RecordConstraints
): Arbitrary<{ [key: string]: T }>;
function record<T>(
  recordModel: { [key: string]: Arbitrary<T> },
  constraints?: RecordConstraints
): Arbitrary<{ [key: string]: T }> {
  if (constraints == null || (constraints.withDeletedKeys !== true && constraints.with_deleted_keys !== true))
    return rawRecord(recordModel);

  const updatedRecordModel: {
    [key: string]: Arbitrary<{ value: T } | null>;
  } = {};
  for (const k of Object.keys(recordModel))
    updatedRecordModel[k] = option(
      recordModel[k].map(v => {
        return { value: v };
      })
    );
  return rawRecord(updatedRecordModel).map(obj => {
    const nobj: { [key: string]: T } = {};
    for (const k of Object.keys(obj)) {
      if (obj[k] != null) nobj[k] = (obj[k] as { value: T }).value;
    }
    return nobj;
  });
}

export { record };
