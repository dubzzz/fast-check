import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';

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
 * Arity of a relation used by {@link entityGraph}
 * @remarks Since 4.5.0
 * @public
 */
export type Arity = '0-1' | '1' | 'many';
/**
 * Strategy of a relation used by {@link entityGraph}
 *
 * @default "any"
 * @remarks Since 4.5.0
 * @public
 */
export type Strategy = 'any' | 'exclusive' | 'successor';
/**
 * Define one relation in the context of the relations(second argument) passed to {@link entityGraph}
 * @remarks Since 4.5.0
 * @public
 */
export type Relationship<TTypeNames> = {
  /**
   * Kind of relation:
   *
   * - '0-1': optional or an instance from "type"
   * - '1': an instance from "type"
   * - 'many': an array of instances from "type", possibly empty and never containing twice the same instance
   *
   * @remarks Since 4.5.0
   */
  arity: Arity;
  /**
   * The type of instance being targeted by the link
   * @remarks Since 4.5.0
   */
  type: TTypeNames;
  /**
   * Restrict the set of instances that can be attached as targets for the relation.
   *
   * - 'any': any instance can make it
   * - 'exclusive': the instance being referenced cannot be re-used by any other relation
   * - 'successor': the instance has to be a (strict) successor of the instance holding the relation (only applies if types are the same for the instance holding the relation and the target instance, otherwise it fallbacks to 'any')
   *
   * @remarks Since 4.5.0
   */
  strategy?: Strategy;
};
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
