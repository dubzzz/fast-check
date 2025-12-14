import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { initialPoolForEntityGraph } from './_internals/InitialPoolForEntityGraphArbitrary.js';
import type { Arbitraries, EntityGraphValue, EntityRelations } from './_internals/interfaces/EntityGraphTypes.js';
import { unlinkedToLinkedEntitiesMapper } from './_internals/mappers/UnlinkedToLinkedEntities.js';
import { onTheFlyLinksForEntityGraph } from './_internals/OnTheFlyLinksForEntityGraphArbitrary.js';
import { unlinkedEntitiesForEntityGraph } from './_internals/UnlinkedEntitiesForEntityGraph.js';
import type { ArrayConstraints } from './array.js';
import type { UniqueArrayConstraintsRecommended } from './uniqueArray.js';

const safeObjectCreate = Object.create;
const safeObjectKeys = Object.keys;

export type { EntityGraphValue, Arbitraries as EntityGraphArbitraries, EntityRelations as EntityGraphRelations };

/**
 * Configuration options for customizing the behavior of {@link entityGraph}
 *
 * @remarks Since 4.5.0
 * @public
 */
export type EntityGraphContraints<TEntityFields> = {
  /**
   * Controls the minimum number of entities generated for each entity type in the initial pool.
   *
   * The initial pool defines the baseline set of entities that are created before any relationships
   * are established. Other entities may be created later to satisfy relationship requirements.
   *
   * @example
   * ```typescript
   * // Ensure at least 2 employees and at most 5 teams in the initial pool
   * { initialPoolConstraints: { employee: { minLength: 2 }, team: { maxLength: 5 } } }
   * ```
   *
   * @defaultValue When unspecified, defaults from {@link array} are used for each entity type
   * @remarks Since 4.5.0
   */
  initialPoolConstraints?: { [EntityName in keyof TEntityFields]?: ArrayConstraints };
  /**
   * Defines uniqueness criteria for entities of each type to prevent duplicate values.
   *
   * The selector function extracts a key from each entity. Entities with identical keys
   * (compared using `Object.is`) are considered duplicates, and only one instance will be kept.
   *
   * @example
   * ```typescript
   * // Ensure employees have unique names
   * { unicityConstraints: { employee: (emp) => emp.name } }
   * ```
   *
   * @defaultValue All entities are considered unique (no deduplication is performed)
   * @remarks Since 4.5.0
   */
  unicityConstraints?: {
    [EntityName in keyof TEntityFields]?: UniqueArrayConstraintsRecommended<
      TEntityFields[EntityName],
      unknown
    >['selector'];
  };
  /**
   * When `true`, prevents the output object from having a null prototype.
   *
   * By default, the generated structure may use objects with null prototypes for efficiency.
   * Setting this to `true` ensures all generated objects have normal prototypes.
   *
   * @defaultValue false
   * @remarks Since 4.5.0
   */
  noNullPrototype?: boolean;
};

/**
 * Generates interconnected entities with relationships based on a schema definition.
 *
 * This arbitrary creates structured data where entities can reference each other through defined
 * relationships. The generated values automatically include links between entities, making it
 * ideal for testing graph structures, relational data, or interconnected object models.
 *
 * The output is an object where each key corresponds to an entity type, and the value is an array
 * of entities of that type. Entities contain both their data fields and relationship links.
 *
 * @example
 * ```typescript
 * // Generate a simple directed graph where nodes link to other nodes
 * fc.entityGraph(
 *   { node: { id: fc.stringMatching(/^[A-Z][a-z]*$/) } },
 *   { node: { linkTo: { arity: 'many', type: 'node' } } },
 * )
 * // Produces: { node: [{ id: "Abc", linkTo: [<node#1>, <node#0>] }, ...] }
 * ```
 *
 * @example
 * ```typescript
 * // Generate employees with managers and teams
 * fc.entityGraph(
 *   {
 *     employee: { name: fc.string() },
 *     team: { name: fc.string() }
 *   },
 *   {
 *     employee: {
 *       manager: { arity: '0-1', type: 'employee' },  // Optional manager
 *       team: { arity: '1', type: 'team' }             // Required team
 *     },
 *     team: {}
 *   }
 * )
 * ```
 *
 * **Relationship Arities:**
 * - `'0-1'`: Optional reference (value or undefined)
 * - `'1'`: Required reference (always present)
 * - `'many'`: Array of references (can be empty, no duplicates)
 *
 * @param arbitraries - Defines the data fields for each entity type (non-relational properties)
 * @param relations - Defines how entities reference each other (relational properties)
 * @param constraints - Optional configuration to customize generation behavior
 *
 * @remarks Since 4.5.0
 * @public
 */
export function entityGraph<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  arbitraries: Arbitraries<TEntityFields>,
  relations: TEntityRelations,
  constraints: EntityGraphContraints<TEntityFields> = {},
): Arbitrary<EntityGraphValue<TEntityFields, TEntityRelations>> {
  const allKeys = safeObjectKeys(arbitraries) as (keyof typeof arbitraries)[];
  const initialPoolConstraints = constraints.initialPoolConstraints || safeObjectCreate(null);
  const unicityConstraints = constraints.unicityConstraints || safeObjectCreate(null);
  const unlinkedContraints = { noNullPrototype: constraints.noNullPrototype };

  return (
    // Step 1, Computing the list of default entities that should take part in the pool
    initialPoolForEntityGraph<keyof TEntityFields>(allKeys, initialPoolConstraints).chain((defaultEntities) =>
      // Step 2, Producing links between entities
      onTheFlyLinksForEntityGraph(relations, defaultEntities).chain((producedLinks) =>
        // Step 3, Producing entities themselves
        // As the number of entities for each kind requires the links to be produced,
        // it has to be executed as a chained computation
        unlinkedEntitiesForEntityGraph(
          arbitraries,
          (name) => producedLinks[name].length,
          (name) => unicityConstraints[name],
          unlinkedContraints,
        ).map((unlinkedEntities) =>
          // Step 4, Glueing links and entities together
          unlinkedToLinkedEntitiesMapper(unlinkedEntities, producedLinks),
        ),
      ),
    )
  );
}
