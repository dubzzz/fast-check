import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';

// Inputs: arbitrary part

/**
 * The sub-type of the type definition for the arbitraries (first argument) passed to {@link entityGraph}
 * @remarks Since 4.5.0
 * @public
 */
export type ArbitraryStructure<TFields> = { [TField in keyof TFields]: Arbitrary<TFields[TField]> };
/**
 * The type definition for the arbitraries (first argument) passed to {@link entityGraph}
 * @remarks Since 4.5.0
 * @public
 */
export type Arbitraries<TEntityFields> = {
  [TEntityName in keyof TEntityFields]: ArbitraryStructure<TEntityFields[TEntityName]>;
};

// Inputs: relations part

/**
 * Define the arity of a relation in the context of the relations(second argument) passed to {@link entityGraph} with:
 *
 * - 0-1 meaning: optional or the entity
 * - 1 meaning: the entity
 * - many meaning: an array of entities, possibly empty, but without duplicates in the array
 *
 * @remarks Since 4.5.0
 * @public
 */
export type Arity = '0-1' | '1' | 'many';
/**
 * Define one relation in the context of the relations(second argument) passed to {@link entityGraph}
 * @remarks Since 4.5.0
 * @public
 */
export type Relationship<TTypeNames> = { arity: Arity; type: TTypeNames };
/**
 * The type definition for the relations (second argument) passed to {@link entityGraph}
 * @remarks Since 4.5.0
 * @public
 */
export type EntityRelations<TEntityFields> = {
  [TEntityName in keyof TEntityFields]: { [TField in string]: Relationship<keyof TEntityFields> };
};

// Output

export type RelationsToValue<TRelations, TValues> = {
  [TField in keyof TRelations]: TRelations[TField] extends { arity: '0-1'; type: infer TTypeName extends keyof TValues }
    ? TValues[TTypeName] | undefined
    : TRelations[TField] extends { arity: '1'; type: infer TTypeName extends keyof TValues }
      ? TValues[TTypeName]
      : TRelations[TField] extends { arity: 'many'; type: infer TTypeName extends keyof TValues }
        ? TValues[TTypeName][]
        : never;
};
export type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type EntityGraphSingleValue<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = {
  [TEntityName in keyof TEntityFields]: Prettify<
    TEntityFields[TEntityName] &
      RelationsToValue<TEntityRelations[TEntityName], EntityGraphSingleValue<TEntityFields, TEntityRelations>>
  >;
};
/**
 * Infer the type of the Arbitrary produced by {@link entityGraph}
 * @remarks Since 4.5.0
 * @public
 */
export type EntityGraphValue<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = {
  [TEntityName in keyof EntityGraphSingleValue<TEntityFields, TEntityRelations>]: EntityGraphSingleValue<
    TEntityFields,
    TEntityRelations
  >[TEntityName][];
};

// Internal types

/** @internal */
export type EntityLinks<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = Record<
  keyof TEntityRelations[keyof TEntityFields],
  { type: keyof TEntityFields; index: number[] | number | undefined }
>;
/** @internal */
export type ProducedLinks<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = Record<
  keyof TEntityFields,
  EntityLinks<TEntityFields, TEntityRelations>[]
>;
/** @internal */
export type UnlinkedEntities<TEntityFields> = { [K in keyof TEntityFields]: TEntityFields[K][] };
