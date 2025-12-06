import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';

// Inputs: arbitrary part

/** @internal */
export type ArbitraryStructure<TFields> = { [TField in keyof TFields]: Arbitrary<TFields[TField]> };
/** @internal */
export type Arbitraries<TEntityFields> = {
  [TEntityName in keyof TEntityFields]: ArbitraryStructure<TEntityFields[TEntityName]>;
};

// Inputs: relations part

/** @internal */
export type Arity = '0-1' | '1' | 'many';
/** @internal */
export type Relationship<TTypeNames> = { arity: Arity; type: TTypeNames };
/** @internal */
export type EntityRelations<TEntityFields> = {
  [TEntityName in keyof TEntityFields]: { [TField in string]: Relationship<keyof TEntityFields> };
};

// Output

/** @internal */
export type RelationsToValue<TRelations, TValues> = {
  [TField in keyof TRelations]: TRelations[TField] extends { arity: '0-1'; type: infer TTypeName extends keyof TValues }
    ? TValues[TTypeName] | undefined
    : TRelations[TField] extends { arity: '1'; type: infer TTypeName extends keyof TValues }
      ? TValues[TTypeName]
      : TRelations[TField] extends { arity: 'many'; type: infer TTypeName extends keyof TValues }
        ? TValues[TTypeName][]
        : never;
};
/** @internal */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};
/** @internal */
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
export type ProducedLinksValue<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = {
  totalCount: number;
  entityLinks: EntityLinks<TEntityFields, TEntityRelations>[];
};
/** @internal */
export type ProducedLinks<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = Record<
  keyof TEntityFields,
  ProducedLinksValue<TEntityFields, TEntityRelations>
>;
/** @internal */
export type ProducedLinksLight<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = Record<
  keyof TEntityFields,
  Pick<ProducedLinksValue<TEntityFields, TEntityRelations>, 'entityLinks'>
>;
/** @internal */
export type UnlinkedEntities<TEntityFields> = { [K in keyof TEntityFields]: TEntityFields[K][] };
