import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';

// Inputs: arbitrary part

/**
 * Defines the shape of a single entity type, where each field is associated with
 * an arbitrary that generates values for that field.
 *
 * @example
 * ```typescript
 * // Employee entity with firstName and lastName fields
 * { firstName: fc.string(), lastName: fc.string() }
 * ```
 *
 * @remarks Since 4.5.0
 * @public
 */
export type ArbitraryStructure<TFields> = { [TField in keyof TFields]: Arbitrary<TFields[TField]> };

/**
 * Defines all entity types and their data fields for {@link entityGraph}.
 *
 * This is the first argument to {@link entityGraph} and specifies the non-relational properties
 * of each entity type. Each key is the name of an entity type and its value defines the
 * arbitraries for that entity.
 *
 * @example
 * ```typescript
 * {
 *   employee: { name: fc.string(), age: fc.nat(100) },
 *   team: { name: fc.string(), size: fc.nat(50) }
 * }
 * ```
 *
 * @remarks Since 4.5.0
 * @public
 */
export type Arbitraries<TEntityFields> = {
  [TEntityName in keyof TEntityFields]: ArbitraryStructure<TEntityFields[TEntityName]>;
};

// Inputs: relations part

/**
 * Cardinality of a relationship between entities.
 *
 * Determines how many target entities can be referenced:
 * - `'0-1'`: Optional relationship — references zero or one target entity (value or undefined)
 * - `'1'`: Required relationship — always references exactly one target entity
 * - `'many'`: Multi-valued relationship — references an array of target entities (may be empty, no duplicates)
 *
 * @remarks Since 4.5.0
 * @public
 */
export type Arity = '0-1' | '1' | 'many';

/**
 * Defines restrictions on which entities can be targeted by a relationship.
 *
 * - `'any'`: No restrictions — any entity of the target type can be referenced
 * - `'exclusive'`: Each target entity can only be referenced by one relationship (prevents sharing)
 * - `'successor'`: Target must appear later in the entity list (prevents cycles)
 *
 * @defaultValue 'any'
 * @remarks Since 4.5.0
 * @public
 */
export type Strategy = 'any' | 'exclusive' | 'successor';
/**
 * Specifies a single relationship between entity types.
 *
 * A relationship defines how one entity type references another (or itself). This configuration
 * determines both the cardinality of the relationship and any restrictions on which entities
 * can be referenced.
 *
 * @example
 * ```typescript
 * // An employee has an optional manager who is also an employee
 * { arity: '0-1', type: 'employee', strategy: 'successor' }
 *
 * // A team has exactly one department
 * { arity: '1', type: 'department' }
 *
 * // An employee can have multiple competencies
 * { arity: 'many', type: 'competency' }
 * ```
 *
 * @remarks Since 4.5.0
 * @public
 */
export type Relationship<TTypeNames> = {
  /**
   * Cardinality of the relationship — determines how many target entities can be referenced.
   *
   * - `'0-1'`: Optional — produces undefined or a single instance of the target type
   * - `'1'`: Required — always produces a single instance of the target type
   * - `'many'`: Multi-valued — produces an array of target instances (may be empty, contains no duplicates)
   *
   * @remarks Since 4.5.0
   */
  arity: Arity;
  /**
   * The name of the entity type being referenced by this relationship.
   *
   * Must be one of the entity type names defined in the first argument to {@link entityGraph}.
   *
   * @remarks Since 4.5.0
   */
  type: TTypeNames;
  /**
   * Constrains which target entities are eligible to be referenced.
   *
   * - `'any'`: No restrictions — any entity of the target type can be selected
   * - `'exclusive'`: Each target can only be used once — prevents multiple relationships from referencing the same entity
   * - `'successor'`: Target must appear after the source in the entity array — prevents self-references and cycles
   *
   * @defaultValue 'any'
   * @remarks Since 4.5.0
   */
  strategy?: Strategy;
};
/**
 * Defines all relationships between entity types for {@link entityGraph}.
 *
 * This is the second argument to {@link entityGraph} and specifies how entities reference each other.
 * Each entity type can have zero or more relationship fields, where each field defines a link
 * to other entities.
 *
 * @example
 * ```typescript
 * {
 *   employee: {
 *     manager: { arity: '0-1', type: 'employee' },
 *     team: { arity: '1', type: 'team' }
 *   },
 *   team: {}
 * }
 * ```
 *
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
 * Type of the values generated by {@link entityGraph}.
 *
 * The output is an object where each key is an entity type name and each value is an array
 * of entities of that type. Each entity contains both its data fields (from arbitraries) and
 * relationship fields (from relations), with relationships resolved to actual entity references.
 *
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
