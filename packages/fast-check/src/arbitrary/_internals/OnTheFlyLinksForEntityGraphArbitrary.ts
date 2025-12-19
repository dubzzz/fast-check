import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import type { Random } from '../../random/generator/Random.js';
import { Stream } from '../../stream/Stream.js';
import {
  safeAdd,
  safeHas,
  safeMap,
  safeMapGet,
  safePush,
  Set as SSet,
  Error as SError,
  String as SString,
} from '../../utils/globals.js';
import { constant } from '../constant.js';
import { integer } from '../integer.js';
import { noBias } from '../noBias.js';
import { option } from '../option.js';
import { uniqueArray } from '../uniqueArray.js';
import { buildInversedRelationsMapping } from './helpers/BuildInversedRelationsMapping.js';
import type { InversedRelationsEntry } from './helpers/BuildInversedRelationsMapping.js';
import { createDepthIdentifier, type DepthIdentifier } from './helpers/DepthContext.js';
import type {
  Arity,
  EntityLinks,
  EntityRelations,
  ProducedLinks,
  Relationship,
  Strategy,
} from './interfaces/EntityGraphTypes.js';

const safeObjectCreate = Object.create;

/** @internal */
function produceLinkUnitaryIndexArbitrary(
  strategy: Strategy,
  currentIndexIfSameType: number | undefined,
  countInTargetType: number,
): Arbitrary<number> {
  switch (strategy) {
    case 'exclusive':
      return constant(countInTargetType);
    case 'successor': {
      const min = currentIndexIfSameType !== undefined ? currentIndexIfSameType + 1 : 0;
      return noBias(integer({ min, max: countInTargetType }));
    }
    case 'any':
      return noBias(integer({ min: 0, max: countInTargetType }));
  }
}

/** @internal */
function computeLinkIndex(
  arity: Exclude<Arity, 'inverse'>,
  strategy: Strategy,
  currentIndexIfSameType: number | undefined,
  countInTargetType: number,
  currentEntityDepth: DepthIdentifier,
  mrng: Random,
  biasFactor: number | undefined,
): number[] | number | undefined {
  const linkArbitrary = produceLinkUnitaryIndexArbitrary(strategy, currentIndexIfSameType, countInTargetType);
  switch (arity) {
    case '0-1':
      return option(linkArbitrary, { nil: undefined, depthIdentifier: currentEntityDepth }).generate(mrng, biasFactor)
        .value;
    case '1':
      return linkArbitrary.generate(mrng, biasFactor).value;
    case 'many': {
      let randomUnicity = 0;
      const values = option(
        // given the depth does not control the size of an array, we cheat and use an option to do so
        uniqueArray(linkArbitrary, {
          depthIdentifier: currentEntityDepth, // passed just in case, but probably ignored by arrays
          selector: (v) => (v === countInTargetType ? v + ++randomUnicity : v),
          minLength: 1, // we handle length 0 with the option
        }),
        { nil: [], depthIdentifier: currentEntityDepth },
      ).generate(mrng, biasFactor).value;
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
  private inversedRelations: Map<Relationship<keyof TEntityFields>, InversedRelationsEntry<TEntityFields>>;

  constructor(
    readonly relations: TEntityRelations,
    readonly defaultEntities: (keyof TEntityFields)[],
  ) {
    super();

    // Basic sanity checks on the relations
    const nonExclusiveEntities = new SSet<keyof TEntityRelations>();
    const exclusiveEntities = new SSet<keyof TEntityRelations>();
    for (const name in relations) {
      const relationsForName = relations[name];
      for (const fieldName in relationsForName) {
        const relation = relationsForName[fieldName];
        if (relation.arity === 'inverse') {
          continue;
        }
        if (relation.strategy === 'exclusive') {
          if (safeHas(nonExclusiveEntities, relation.type)) {
            throw new SError(`Cannot mix exclusive with other strategies for type ${SString(relation.type)}`);
          }
          safeAdd(exclusiveEntities, relation.type);
        } else {
          if (safeHas(exclusiveEntities, relation.type)) {
            throw new SError(`Cannot mix exclusive with other strategies for type ${SString(relation.type)}`);
          }
          safeAdd(nonExclusiveEntities, relation.type);
        }
        if (relation.strategy === 'successor' && relation.type !== (name as keyof TEntityRelations)) {
          throw new SError(`Cannot mix types for the strategy successor`);
        }
        if (relation.strategy === 'successor' && relation.arity === '1') {
          throw new SError(`Cannot use an arity of 1 for the strategy successor`);
        }
      }
    }

    // Building inversed relations map
    this.inversedRelations = buildInversedRelationsMapping(relations);
  }

  createEmptyLinksInstanceFor(targetType: keyof TEntityFields): EntityLinks<TEntityFields, TEntityRelations> {
    const emptyLinksInstance = safeObjectCreate(null);
    const relationsForType = this.relations[targetType];
    for (const name in relationsForType) {
      const relation = relationsForType[name];
      if (relation.arity === 'inverse') {
        emptyLinksInstance[name] = { type: relation.type, index: [] };
      }
    }
    return emptyLinksInstance;
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
      safePush(producedLinks[name], this.createEmptyLinksInstanceFor(name));
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
        if (relation.arity === 'inverse') {
          continue;
        }
        const targetType = relation.type;
        const producedLinksInTargetType = producedLinks[targetType];
        const countInTargetType = producedLinksInTargetType.length;
        const linkOrLinks = computeLinkIndex(
          relation.arity,
          relation.strategy || 'any',
          targetType === currentEntity.type ? currentEntity.indexInType : undefined,
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
            safePush(producedLinksInTargetType, this.createEmptyLinksInstanceFor(targetType));
          }
          const inversed = safeMapGet(this.inversedRelations, relation);
          if (inversed !== undefined) {
            const knownInversedLinks = producedLinksInTargetType[link][inversed.property].index;
            safePush(knownInversedLinks as number[], currentEntity.indexInType);
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
