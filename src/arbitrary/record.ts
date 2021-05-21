import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { option } from './option';
import { extractEnumerableKeys } from './_internals/helpers/EnumerableKeysExtractor';
import { buildFullRecordArbitrary } from './_internals/builders/FullRecordArbitraryBuilder';

/**
 * Constraints to be applied on {@link record}
 * @remarks Since 0.0.12
 * @public
 */
export type RecordConstraints<T = unknown> =
  | {
      /**
       * List keys that should never be deleted.
       *
       * Remark:
       * You might need to use an explicit typing in case you need to declare symbols as required (not needed when required keys are simple strings).
       * With something like `{ requiredKeys: [mySymbol1, 'a'] as [typeof mySymbol1, 'a'] }` when both `mySymbol1` and `a` are required.
       *
       * Warning: Cannot be used in conjunction with withDeletedKeys.
       *
       * @remarks Since 2.11.0
       */
      requiredKeys?: T[];
    }
  | {
      /**
       * Allow to remove keys from the generated record.
       * Warning: Cannot be used in conjunction with requiredKeys.
       * Prefer: `requiredKeys: []` over `withDeletedKeys: true`
       * @remarks Since 1.0.0
       */
      withDeletedKeys?: boolean;
    };

/**
 * Infer the type of the Arbitrary produced by record
 * given the type of the source arbitrary and constraints to be applied
 *
 * @remarks Since 2.2.0
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
 * @remarks Since 0.0.12
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
 * @remarks Since 0.0.12
 * @public
 */
function record<T, TConstraints extends RecordConstraints<keyof T>>(
  recordModel: { [K in keyof T]: Arbitrary<T[K]> },
  constraints: TConstraints
): Arbitrary<RecordValue<{ [K in keyof T]: T[K] }, TConstraints>>;
function record<T>(
  recordModel: { [K in keyof T]: Arbitrary<T[K]> },
  constraints?: RecordConstraints<keyof T>
): unknown {
  if (constraints == null) {
    return buildFullRecordArbitrary(recordModel);
  }

  if ('withDeletedKeys' in constraints && 'requiredKeys' in constraints) {
    throw new Error(`requiredKeys and withDeletedKeys cannot be used together in fc.record`);
  }

  const requireDeletedKeys =
    ('requiredKeys' in constraints && constraints.requiredKeys !== undefined) ||
    ('withDeletedKeys' in constraints && !!constraints.withDeletedKeys);
  if (!requireDeletedKeys) {
    return buildFullRecordArbitrary(recordModel);
  }

  const requiredKeys = ('requiredKeys' in constraints ? constraints.requiredKeys : undefined) || [];
  for (let idx = 0; idx !== requiredKeys.length; ++idx) {
    const descriptor = Object.getOwnPropertyDescriptor(recordModel, requiredKeys[idx]);
    if (descriptor === undefined) {
      throw new Error(`requiredKeys cannot reference keys that have not been defined in recordModel`);
    }
    if (!descriptor.enumerable) {
      throw new Error(`requiredKeys cannot reference keys that have are enumerable in recordModel`);
    }
  }

  const updatedRecordModel: { [K in keyof T]?: Arbitrary<{ value: T[K] } | null> } = {};
  const keys = extractEnumerableKeys(recordModel);
  for (let index = 0; index !== keys.length; ++index) {
    const k = keys[index];
    const requiredArbitrary = recordModel[k].map((v) => ({ value: v }));
    if (requiredKeys.indexOf(k) !== -1) updatedRecordModel[k] = requiredArbitrary;
    else updatedRecordModel[k] = option(requiredArbitrary);
  }
  return buildFullRecordArbitrary(updatedRecordModel as any).map((rawObj) => {
    const obj = rawObj as { [K in keyof T]: { value: T[keyof T] } | null };
    const nobj: { [K in keyof T]?: T[keyof T] } = {};
    for (let index = 0; index !== keys.length; ++index) {
      const k = keys[index];
      if (obj[k] !== null) {
        nobj[k] = (obj[k] as { value: T[keyof T] }).value;
      }
    }
    return nobj;
  });
}

export { record };
