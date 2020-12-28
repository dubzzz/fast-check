import { Arbitrary } from './definition/Arbitrary';

import { option } from './OptionArbitrary';
import { genericTuple } from './TupleArbitrary';

/**
 * Constraints to be applied on {@link record}
 * @public
 */
export type RecordConstraints<T = unknown> =
  | {
      /**
       * List keys that should never be deleted.
       * Warning: Cannot be used in conjunction with withDeletedKeys.
       */
      requiredKeys?: T[];
    }
  | {
      /**
       * Allow to remove keys from the generated record.
       * Warning: Cannot be used in conjunction with requiredKeys.
       * Prefer: `requiredKeys: []` over `withDeletedKeys: true`
       */
      withDeletedKeys?: boolean;
    };

/**
 * Infer the type of the Arbitrary produced by record
 * given the type of the source arbitrary and constraints to be applied
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type RecordValue<T, TConstraints = {}> = TConstraints extends { withDeletedKeys: boolean; requiredKeys: any[] }
  ? never
  : TConstraints extends { withDeletedKeys: true }
  ? Partial<T>
  : TConstraints extends { requiredKeys: (infer TKeys)[] }
  ? Partial<T> & Pick<T, TKeys & keyof T>
  : T;

/** @internal */
function rawRecord<T>(recordModel: { [K in keyof T]: Arbitrary<T[K]> }): Arbitrary<{ [K in keyof T]: T[K] }> {
  const keys: Extract<keyof T, string>[] = [];
  const arbs: Arbitrary<T[keyof T]>[] = [];
  for (const k in recordModel) {
    keys.push(k);
    arbs.push(recordModel[k]);
  }
  return genericTuple(arbs).map((gs: any[]) => {
    const obj: { [key: string]: any } = {};
    for (let idx = 0; idx !== keys.length; ++idx) {
      obj[keys[idx]] = gs[idx];
    }
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
 * @param recordModel - Schema of the record
 *
 * @public
 */
function record<T>(recordModel: { [K in keyof T]: Arbitrary<T[K]> }): Arbitrary<RecordValue<{ [K in keyof T]: T[K] }>>;
/**
 * For records following the `recordModel` schema
 *
 * @example
 * ```typescript
 * record({ x: someArbitraryInt, y: someArbitraryInt }, {withDeletedKeys: true}): Arbitrary<{x?:number,y?:number}>
 * // merge two integer arbitraries to produce a {x, y}, {x}, {y} or {} record
 * ```
 *
 * @param recordModel - Schema of the record
 * @param constraints - Contraints on the generated record
 *
 * @public
 */
function record<T, TConstraints extends RecordConstraints<keyof T>>(
  recordModel: { [K in keyof T]: Arbitrary<T[K]> },
  constraints: TConstraints
): Arbitrary<RecordValue<{ [K in keyof T]: T[K] }, TConstraints>>;
function record<T>(recordModel: { [K in keyof T]: Arbitrary<T[K]> }, constraints?: RecordConstraints<keyof T>) {
  if (constraints == null) {
    return rawRecord(recordModel);
  }
  if ('withDeletedKeys' in constraints && 'requiredKeys' in constraints) {
    throw new Error(`requiredKeys and withDeletedKeys cannot be used together in fc.record`);
  }

  const requireDeletedKeys =
    ('requiredKeys' in constraints && constraints.requiredKeys !== undefined) ||
    ('withDeletedKeys' in constraints && !!constraints.withDeletedKeys);
  if (!requireDeletedKeys) {
    return rawRecord(recordModel);
  }

  const updatedRecordModel: { [key: string]: Arbitrary<{ value: T[keyof T] } | null> } = {};
  const requiredKeys = ('requiredKeys' in constraints ? constraints.requiredKeys : undefined) || [];

  for (let idx = 0; idx !== requiredKeys.length; ++idx) {
    if (!(requiredKeys[idx] in recordModel)) {
      throw new Error(`requiredKeys cannot reference keys that have not been defined in recordModel`);
    }
  }

  for (const k in recordModel) {
    const requiredArbitrary = recordModel[k].map((v) => ({ value: v }));
    if (requiredKeys.indexOf(k) !== -1) updatedRecordModel[k] = requiredArbitrary;
    else updatedRecordModel[k] = option(requiredArbitrary);
  }
  return rawRecord(updatedRecordModel).map((obj) => {
    const nobj: { [key: string]: T[keyof T] } = {};
    for (const k in obj) {
      if (obj[k] != null) {
        nobj[k] = (obj[k] as { value: T[keyof T] }).value;
      }
    }
    return nobj;
  });
}

export { record };
