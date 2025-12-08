import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import type { Arbitraries, EntityGraphValue, EntityRelations } from './_internals/interfaces/EntityGraphTypes';
import { unlinkedToLinkedEntitiesMapper } from './_internals/mappers/UnlinkedToLinkedEntities';
import { onTheFlyLinksForEntityGraph } from './_internals/OnTheFlyLinksForEntityGraphArbitrary';
import { unlinkedEntitiesForEntityGraph } from './_internals/UnlinkedEntitiesForEntityGraph';

const safeObjectKeys = Object.keys;

export type { EntityGraphValue, Arbitraries as EntityGraphArbitraries, EntityRelations as EntityGraphRelations };

/**
 * Constraints to be applied on {@link entityGraph}
 * @remarks Since 4.5.0
 * @public
 */
export type EntityGraphContraints = {
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
  constraints: EntityGraphContraints = {},
): Arbitrary<EntityGraphValue<TEntityFields, TEntityRelations>> {
  const defaultEntities = safeObjectKeys(arbitraries) as (keyof typeof arbitraries)[];
  const unlinkedContraints = { noNullPrototype: constraints.noNullPrototype };

  return (
    // Step 1, Producing links between entities
    onTheFlyLinksForEntityGraph(relations, defaultEntities).chain((producedLinks) =>
      // Step 2, Producing entities themselves
      // As the number of entities for each kind requires the links to be produced,
      // it has to be executed as a chained computation
      unlinkedEntitiesForEntityGraph(arbitraries, (name) => producedLinks[name].length, unlinkedContraints).map(
        (unlinkedEntities) =>
          // Step 3, Glueing links and entities together
          unlinkedToLinkedEntitiesMapper(unlinkedEntities, producedLinks),
      ),
    )
  );
}
