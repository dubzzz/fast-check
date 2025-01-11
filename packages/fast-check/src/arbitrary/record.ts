import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildPartialRecordArbitrary } from './_internals/builders/PartialRecordArbitraryBuilder';
import type { EnumerableKeyOf } from './_internals/helpers/EnumerableKeysExtractor';

/**
 * Constraints to be applied on {@link record}
 * @remarks Since 0.0.12
 * @public
 */
export type RecordConstraints<T = unknown> = {
  /**
   * List keys that should never be deleted.
   *
   * Remark:
   * You might need to use an explicit typing in case you need to declare symbols as required (not needed when required keys are simple strings).
   * With something like `{ requiredKeys: [mySymbol1, 'a'] as [typeof mySymbol1, 'a'] }` when both `mySymbol1` and `a` are required.
   *
   * @defaultValue Array containing all keys of recordModel
   * @remarks Since 2.11.0
   */
  requiredKeys?: T[];
  /**
   * Do not generate records with null prototype
   * @defaultValue false
   * @remarks Since 3.13.0
   */
  noNullPrototype?: boolean;
};

/**
 * Infer the type of the Arbitrary produced by record
 * given the type of the source arbitrary and constraints to be applied
 *
 * @remarks Since 2.2.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type RecordValue<T, TConstraints = {}> = TConstraints extends { requiredKeys: (infer TKeys)[] }
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
 * record({ x: someArbitraryInt, y: someArbitraryInt }, {requiredKeys: []}): Arbitrary<{x?:number,y?:number}>
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
  constraints: TConstraints,
): Arbitrary<RecordValue<{ [K in keyof T]: T[K] }, TConstraints>>;
function record<T>(
  recordModel: { [K in keyof T]: Arbitrary<T[K]> },
  constraints?: RecordConstraints<keyof T>,
): unknown {
  const noNullPrototype = !!(constraints !== undefined && constraints.noNullPrototype);
  if (constraints == null) {
    return buildPartialRecordArbitrary(recordModel, undefined, noNullPrototype);
  }

  const requireDeletedKeys = 'requiredKeys' in constraints && constraints.requiredKeys !== undefined;
  if (!requireDeletedKeys) {
    return buildPartialRecordArbitrary(recordModel, undefined, noNullPrototype);
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

  return buildPartialRecordArbitrary(recordModel, requiredKeys as EnumerableKeyOf<T>[], noNullPrototype);
}

export { record };
