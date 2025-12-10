import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { initialPoolForEntityGraph } from './_internals/InitialPoolForEntityGraphArbitrary';
import type { Arbitraries, EntityGraphValue, EntityRelations } from './_internals/interfaces/EntityGraphTypes';
import { unlinkedToLinkedEntitiesMapper } from './_internals/mappers/UnlinkedToLinkedEntities';
import { onTheFlyLinksForEntityGraph } from './_internals/OnTheFlyLinksForEntityGraphArbitrary';
import { unlinkedEntitiesForEntityGraph } from './_internals/UnlinkedEntitiesForEntityGraph';
import type { ArrayConstraints } from './array';
import type { UniqueArrayConstraintsRecommended } from './uniqueArray';

const safeObjectCreate = Object.create;
const safeObjectKeys = Object.keys;

export type { EntityGraphValue, Arbitraries as EntityGraphArbitraries, EntityRelations as EntityGraphRelations };

/**
 * Constraints to be applied on {@link entityGraph}
 * @remarks Since 4.5.0
 * @public
 */
export type EntityGraphContraints<TEntityFields> = {
  /**
   * Customize how to select what should be part of the initial pool of entities.
   * This pool is used as a starting point to ask and create for other entities.
   *
   * @defaultValue Unspecified entities take the defaults from {@link array}
   * @remarks Since 4.5.0
   */
  initialPoolConstraints?: { [EntityName in keyof TEntityFields]?: ArrayConstraints };
  /**
   * Unicity rules to be applied on a specific kind. The provided selector function will be leveraged to compare entities of a given kind.
   * Two entities resulting on an equal output for `Object.is` will be considered equivalent and only one of them will be kept.
   *
   * @defaultValue All values are considered unique
   * @remarks Since 4.5.0
   */
  unicityConstraints?: {
    [EntityName in keyof TEntityFields]?: UniqueArrayConstraintsRecommended<
      TEntityFields[EntityName],
      unknown
    >['selector'];
  };
  /**
   * Do not generate records with null prototype
   * @defaultValue false
   * @remarks Since 4.5.0
   */
  noNullPrototype?: boolean;
};

/**
 * Generate values based on a schema. Produced values will automatically come with links between each others when requested to.
 *
 * Declaring a directed graph using this helper could easily be achieved with something like:
 *
 * @example
 * ```typescript
 * fc.entityGraph(
 *   { node: { id: fc.stringMatching(/^[A-Z][a-z]*$/) } },
 *   { node: { linkTo: { arity: 'many', type: 'node' } } },
 * )
 * ```
 *
 * But user can also requests the helper for other values of arity: '0-1' for an optional link, '1' for a compulsory one and 'many' as in the example above.
 * The type field declares the kind of entity we want to target; In our case we only declared "node", so a "node" will have zero to many "node" accessible from the field "linkTo".
 *
 * @param arbitraries - The non-relational part of the produced entities.
 * @param relations - The relational part of the produced entities. It tells the framework how entities should refer to each others.
 * @param constraints - A set of constraints to be applied on the produced values.
 *
 * @remarks Since 4.5.0
 * @public
 */
export function entityGraph<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  arbitraries: Arbitraries<TEntityFields>,
  relations: TEntityRelations,
  constraints: EntityGraphContraints<keyof TEntityFields> = {},
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
