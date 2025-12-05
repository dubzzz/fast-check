import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import type { Value } from '../check/arbitrary/definition/Value';
import type { Random } from '../random/generator/Random';
import { Stream } from '../stream/Stream';
import { safeMap, safePush } from '../utils/globals';
import type {
  Arbitraries,
  Arity,
  EntityGraphValue,
  EntityLinks,
  EntityRelations,
  ProducedLinks,
  UnlinkedEntities,
} from './_internals/interfaces/EntityGraphTypes';
import { unlinkedToLinkedEntitiesMapper } from './_internals/mappers/UnlinkedToLinkedEntities';
import { array } from './array';
import { integer } from './integer';
import { noBias } from './noBias';
import { option } from './option';
import { record } from './record';
import { uniqueArray } from './uniqueArray';

const safeObjectCreate = Object.create;

type EntityGraphContraints = {
  /**
   * Do not generate records with null prototype
   * @defaultValue false
   * @remarks Since x.x.x
   */
  noNullPrototype?: boolean;
};

// Internal class containing the implementation
class EntityGraphArbitrary<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> extends Arbitrary<
  EntityGraphValue<TEntityFields, TEntityRelations>
> {
  constructor(
    readonly arbitraries: Arbitraries<TEntityFields>,
    readonly relations: TEntityRelations,
    readonly constraints: { defaultEntities: (keyof TEntityFields)[] } & EntityGraphContraints,
  ) {
    super();
  }

  private static computeLinkIndex(
    arity: Arity,
    countInTargetType: number,
    mrng: Random,
    biasFactor: number | undefined,
  ): number[] | number | undefined {
    const linkArbitrary = noBias(integer({ min: 0, max: countInTargetType }));
    switch (arity) {
      case '0-1':
        return option(linkArbitrary, { nil: undefined }).generate(mrng, biasFactor).value;
      case '1':
        return linkArbitrary.generate(mrng, biasFactor).value;
      case 'many': {
        let randomUnicity = 0;
        const values = uniqueArray(linkArbitrary, {
          selector: (v) => (v === countInTargetType ? v + ++randomUnicity : v),
        }).generate(mrng, biasFactor).value;
        let offset = 0;
        return safeMap(values, (v) => (v === countInTargetType ? v + offset++ : v));
      }
    }
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<EntityGraphValue<TEntityFields, TEntityRelations>> {
    // The set of all produced links between entities.
    const producedLinks: ProducedLinks<TEntityFields, TEntityRelations> = safeObjectCreate(null);
    for (const name in this.arbitraries) {
      producedLinks[name] = { totalCount: 0, entityLinks: [] };
    }
    // Made of any entity whose links have to be created before building the whole graph.
    const toBeProducedEntities: { type: keyof TEntityFields; indexInType: number }[] = [];
    for (const name of this.constraints.defaultEntities) {
      safePush(toBeProducedEntities, { type: name, indexInType: producedLinks[name].totalCount++ });
    }

    // STEP I - Producing links between entities...
    // Ideally toBeProducedEntities should be a queue, but given JavaScript built-ins arrays perform badly in queue mode,
    // we decided to consider an always growing array that will grow up to the numer of entities before being dropped.
    let lastTreatedEntities = -1;
    while (++lastTreatedEntities < toBeProducedEntities.length) {
      const currentEntity = toBeProducedEntities[lastTreatedEntities];
      const currentRelations = this.relations[currentEntity.type];
      const currentProducedLinks = producedLinks[currentEntity.type];
      // Create all the links going from the current entity to others
      const currentLinks: EntityLinks<TEntityFields, TEntityRelations> = safeObjectCreate(null);
      for (const name in currentRelations) {
        const relation = currentRelations[name];
        const targetType = relation.type;
        const producedLinksInTargetType = producedLinks[targetType];
        const countInTargetType = producedLinksInTargetType.totalCount;
        const linkOrLinks = EntityGraphArbitrary.computeLinkIndex(
          relation.arity,
          producedLinksInTargetType.totalCount,
          mrng,
          biasFactor,
        );
        currentLinks[name] = { type: targetType, index: linkOrLinks };
        const links = linkOrLinks === undefined ? [] : typeof linkOrLinks === 'number' ? [linkOrLinks] : linkOrLinks;
        for (const link of links) {
          if (link >= countInTargetType) {
            safePush(toBeProducedEntities, { type: targetType, indexInType: link }); // should be equal to producedLinksInTargetType.totalCount
            producedLinksInTargetType.totalCount += 1;
          }
        }
      }
      safePush(currentProducedLinks.entityLinks, currentLinks); // should be pushed at indexInType
    }
    // Drop any item from the array
    toBeProducedEntities.length = 0;

    // STEP II - Producing entities themselves
    const recordContraints = { noNullPrototype: this.constraints.noNullPrototype };
    const recordModel: { [K in keyof TEntityFields]: Arbitrary<TEntityFields[K][]> } = safeObjectCreate(null);
    for (const name in this.arbitraries) {
      const entityRecordModel = this.arbitraries[name];
      const count = producedLinks[name].totalCount;
      recordModel[name] = array(record(entityRecordModel, recordContraints), {
        minLength: count,
        maxLength: count,
      }) as any;
    }
    return record<UnlinkedEntities<TEntityFields>>(recordModel)
      .map((unlinkedEntities) => {
        // @ts-expect-error - We probably have a fishy typing issue in `record`, as we are supposed to produce `UnlinkedEntities<TEntityFields>`
        const safeUnlinkedEntities: UnlinkedEntities<TEntityFields> = unlinkedEntities;
        return unlinkedToLinkedEntitiesMapper(safeUnlinkedEntities, producedLinks);
      })
      .generate(mrng, biasFactor);
  }

  canShrinkWithoutContext(value: unknown): value is EntityGraphValue<TEntityFields, TEntityRelations> {
    return false; // for now, we reject any shrink without any context
  }

  shrink(
    _value: unknown,
    _context: unknown | undefined,
  ): Stream<Value<EntityGraphValue<TEntityFields, TEntityRelations>>> {
    return Stream.nil(); // for now, we don't support any shrink
  }
}

export function entityGraph<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  arbitraries: Arbitraries<TEntityFields>,
  relations: TEntityRelations,
  constraints: EntityGraphContraints = {},
): Arbitrary<EntityGraphValue<TEntityFields, TEntityRelations>> {
  const defaultEntities = Object.keys(arbitraries) as (keyof typeof arbitraries)[];
  return new EntityGraphArbitrary(arbitraries, relations, { ...constraints, defaultEntities });
}
