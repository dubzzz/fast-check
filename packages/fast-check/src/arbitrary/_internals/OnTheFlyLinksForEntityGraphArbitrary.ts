import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import type { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { safeMap, safePush } from '../../utils/globals';
import { integer } from '../integer';
import { noBias } from '../noBias';
import { option } from '../option';
import { uniqueArray } from '../uniqueArray';
import { createDepthIdentifier, type DepthIdentifier } from './helpers/DepthContext';
import type { Arity, EntityRelations, ProducedLinks } from './interfaces/EntityGraphTypes';

const safeObjectCreate = Object.create;

/** @internal */
function computeLinkIndex(
  arity: Arity,
  countInTargetType: number,
  currentEntityDepth: DepthIdentifier,
  mrng: Random,
  biasFactor: number | undefined,
): number[] | number | undefined {
  const linkArbitrary = noBias(integer({ min: 0, max: countInTargetType }));
  switch (arity) {
    case '0-1':
      return option(linkArbitrary, { nil: undefined, depthIdentifier: currentEntityDepth }).generate(mrng, biasFactor)
        .value;
    case '1':
      return linkArbitrary.generate(mrng, biasFactor).value;
    case 'many': {
      let randomUnicity = 0;
      const values = uniqueArray(linkArbitrary, {
        depthIdentifier: currentEntityDepth,
        selector: (v) => (v === countInTargetType ? v + ++randomUnicity : v),
      }).generate(mrng, biasFactor).value;
      let offset = 0;
      return safeMap(values, (v) => (v === countInTargetType ? v + offset++ : v));
    }
  }
}

/** @internal */
class OnTheFlyLinksForEntityGraphArbitrary<
  TEntityFields,
  TEntityRelations extends EntityRelations<TEntityFields>,
> extends Arbitrary<ProducedLinks<TEntityFields, TEntityRelations>> {
  constructor(
    readonly relations: TEntityRelations,
    readonly defaultEntities: (keyof TEntityFields)[],
  ) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<ProducedLinks<TEntityFields, TEntityRelations>> {
    // The set of all produced links between entities.
    const producedLinks: ProducedLinks<TEntityFields, TEntityRelations> = safeObjectCreate(null);
    for (const name in this.relations) {
      producedLinks[name as Extract<keyof TEntityFields, string>] = [];
    }
    // Made of any entity whose links have to be created before building the whole graph.
    const toBeProducedEntities: { type: keyof TEntityFields; indexInType: number; depth: number }[] = [];
    for (const name of this.defaultEntities) {
      safePush(toBeProducedEntities, { type: name, indexInType: producedLinks[name].length, depth: 0 });
      safePush(producedLinks[name], safeObjectCreate(null));
    }

    // Ideally toBeProducedEntities should be a queue, but given JavaScript built-ins arrays perform badly in queue mode,
    // we decided to consider an always growing array that will grow up to the numer of entities before being dropped.
    let lastTreatedEntities = -1;
    while (++lastTreatedEntities < toBeProducedEntities.length) {
      const currentEntity = toBeProducedEntities[lastTreatedEntities];
      const currentRelations = this.relations[currentEntity.type];
      const currentProducedLinks = producedLinks[currentEntity.type];
      // Create all the links going from the current entity to others
      const currentLinks = currentProducedLinks[currentEntity.indexInType];
      const currentEntityDepth = createDepthIdentifier();
      currentEntityDepth.depth = currentEntity.depth;
      for (const name in currentRelations) {
        const relation = currentRelations[name];
        const targetType = relation.type;
        const producedLinksInTargetType = producedLinks[targetType];
        const countInTargetType = producedLinksInTargetType.length;
        const linkOrLinks = computeLinkIndex(
          relation.arity,
          producedLinksInTargetType.length,
          currentEntityDepth,
          mrng,
          biasFactor,
        );
        currentLinks[name] = { type: targetType, index: linkOrLinks };
        const links = linkOrLinks === undefined ? [] : typeof linkOrLinks === 'number' ? [linkOrLinks] : linkOrLinks;
        for (const link of links) {
          if (link >= countInTargetType) {
            safePush(toBeProducedEntities, { type: targetType, indexInType: link, depth: currentEntity.depth + 1 }); // indexInType should be equal to producedLinksInTargetType.length
            safePush(producedLinksInTargetType, safeObjectCreate(null));
          }
        }
      }
    }
    // Drop any item from the array
    toBeProducedEntities.length = 0;

    return new Value(producedLinks, undefined);
  }

  canShrinkWithoutContext(value: unknown): value is ProducedLinks<TEntityFields, TEntityRelations> {
    return false; // for now, we reject any shrink without context
  }

  shrink(
    _value: ProducedLinks<TEntityFields, TEntityRelations>,
    _context: unknown | undefined,
  ): Stream<Value<ProducedLinks<TEntityFields, TEntityRelations>>> {
    return Stream.nil(); // for now, we don't support any shrink
  }
}

/** @internal */
export function onTheFlyLinksForEntityGraph<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
  defaultEntities: (keyof TEntityFields)[],
): Arbitrary<ProducedLinks<TEntityFields, TEntityRelations>> {
  return new OnTheFlyLinksForEntityGraphArbitrary(relations, defaultEntities);
}
