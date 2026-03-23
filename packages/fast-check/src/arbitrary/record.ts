import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { buildPartialRecordArbitrary } from './_internals/builders/PartialRecordArbitraryBuilder.js';
import type { EnumerableKeyOf } from './_internals/helpers/EnumerableKeysExtractor.js';

type Prettify<T> = { [K in keyof T]: T[K] } & {};

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
export type RecordValue<T, K> = Prettify<Partial<T> & Pick<T, K & keyof T>>;

/** @internal */
type IsOptional<TType, TKey extends keyof TType> = Pick<TType, TKey> extends Record<TKey, TType[TKey]> ? false : true;

/** @internal */
type RequiredKeysOf<TType> = keyof {
  [K in keyof TType as IsOptional<TType, K> extends true ? never : K]: never;
};

/**
 * Shape of the record model when using an explicit output type.
 * Required keys in TOut must have their Arbitrary provided.
 * Optional keys may be omitted or provided with an Arbitrary of the non-undefined type.
 * @internal
 */
type RecordShape<TOut> = {
  [K in keyof TOut as IsOptional<TOut, K> extends true ? never : K]: Arbitrary<TOut[K]>;
} & {
  [K in keyof TOut as IsOptional<TOut, K> extends true ? K : never]?: Arbitrary<Exclude<TOut[K], undefined>>;
};

/**
 * Generate all permutations of keys as a tuple type.
 * Used to enforce that requiredKeys contains exactly all required keys.
 * @internal
 */
type AllPermutations<TKeys extends PropertyKey> = [TKeys] extends [never]
  ? []
  : { [K in TKeys]: [K, ...AllPermutations<Exclude<TKeys, K>>] }[TKeys];

/**
 * Constraints for record when an explicit output type TOut is provided.
 * requiredKeys must list exactly all non-optional keys of TOut in any order.
 * @internal
 */
type ExplicitRecordConstraints<TOut> = {
  requiredKeys: AllPermutations<RequiredKeysOf<TOut>>;
  noNullPrototype?: boolean;
};

/**
 * For records following the `recordModel` schema with an explicit output type
 *
 * @example
 * ```typescript
 * record<{ x: number, y?: number }>({ x: someArbitraryInt, y: someArbitraryInt }, { requiredKeys: ['x'] })
 * // produce records matching { x: number, y?: number }
 * ```
 *
 * @param recordModel - Schema of the record
 * @param constraints - Constraints listing exactly the required (non-optional) keys of TOut
 *
 * @remarks Since 0.0.12
 * @public
 */
function record<TOut>(
  model: RecordShape<TOut>,
  constraints: ExplicitRecordConstraints<TOut>,
): Arbitrary<TOut>;
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
function record<T, K extends keyof T = keyof T>(
  model: { [K in keyof T]: Arbitrary<T[K]> },
  constraints?: RecordConstraints<K>,
): Arbitrary<RecordValue<T, K>>;

function record<T>(
  recordModel: { [K in keyof T]: Arbitrary<T[K]> },
  constraints?: RecordConstraints<keyof T>,
): unknown {
  const noNullPrototype = constraints !== undefined && !!constraints.noNullPrototype;
  if (constraints === undefined) {
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
      throw new Error(`requiredKeys cannot reference keys that are not enumerable in recordModel`);
    }
  }

  return buildPartialRecordArbitrary(recordModel, requiredKeys as EnumerableKeyOf<T>[], noNullPrototype);
}

export { record };
