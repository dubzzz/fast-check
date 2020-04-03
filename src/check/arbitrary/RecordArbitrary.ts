import { Arbitrary } from './definition/Arbitrary';

import { option } from './OptionArbitrary';
import { genericTuple } from './TupleArbitrary';

export interface RecordConstraints {
  /** Allow to remove keys from the generated record */
  withDeletedKeys?: boolean;
}

interface DeletedKeys {
  withDeletedKeys: true;
}

type ConstrainedArbitrary<T, Constraints> = Constraints extends DeletedKeys ? Arbitrary<Partial<T>> : Arbitrary<T>;

/** @internal */
function rawRecord<T>(recordModel: { [K in keyof T]: Arbitrary<T[K]> }): Arbitrary<{ [K in keyof T]: T[K] }> {
  const keys = Object.keys(recordModel);
  const arbs: Arbitrary<any>[] = keys.map(v => (recordModel as { [key: string]: Arbitrary<any> })[v]);
  return genericTuple(arbs).map((gs: any[]) => {
    const obj: { [key: string]: any } = {};
    for (let idx = 0; idx !== keys.length; ++idx) obj[keys[idx]] = gs[idx];
    return obj as { [K in keyof T]: T[K] };
  });
}

/**
 * For records following the `recordModel` schema
 *
 * @example
 * ```typescript
 * record({ x: someArbitraryInt, y: someArbitraryInt }): Arbitrary<{x:number,y:number}>
 * // merge two integer arbitraries to produce a {x, y} record
 * ```
 *
 * @param recordModel Schema of the record
 */
function record<T>(recordModel: { [K in keyof T]: Arbitrary<T[K]> }): Arbitrary<{ [K in keyof T]: T[K] }>;
/**
 * For records following the `recordModel` schema
 *
 * @example
 * ```typescript
 * record({ x: someArbitraryInt, y: someArbitraryInt }, {withDeletedKeys: true}): Arbitrary<{x?:number,y?:number}>
 * // merge two integer arbitraries to produce a {x, y}, {x}, {y} or {} record
 * ```
 *
 * @param recordModel Schema of the record
 * @param constraints Contraints on the generated record
 */
function record<T, Constraints extends RecordConstraints>(
  recordModel: { [K in keyof T]: Arbitrary<T[K]> },
  constraints: Constraints
): ConstrainedArbitrary<{ [K in keyof T]: T[K] }, Constraints>;
function record<T>(recordModel: { [K in keyof T]: Arbitrary<T[K]> }, constraints?: RecordConstraints) {
  if (constraints == null || constraints.withDeletedKeys !== true) {
    return rawRecord(recordModel);
  }

  const updatedRecordModel: {
    [key: string]: Arbitrary<{ value: T } | null>;
  } = {};
  for (const k of Object.keys(recordModel))
    updatedRecordModel[k] = option((recordModel as { [key: string]: Arbitrary<any> })[k].map(v => ({ value: v })));
  return rawRecord(updatedRecordModel).map(obj => {
    const nobj: { [key: string]: T } = {};
    for (const k of Object.keys(obj)) {
      if (obj[k] != null) nobj[k] = (obj[k] as { value: T }).value;
    }
    return nobj;
  });
}

export { record };
