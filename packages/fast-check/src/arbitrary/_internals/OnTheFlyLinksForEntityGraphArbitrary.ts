import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import {
  safeAdd,
  safeHas,
  safeMap,
  safePush,
  Set as SSet,
  Error as SError,
  String as SString,
} from '../../utils/globals.js';
import { constant } from '../constant.js';
import { integer } from '../integer.js';
import { noBias } from '../noBias.js';
import { option } from '../option.js';
import { tuple } from '../tuple.js';
import { uniqueArray } from '../uniqueArray.js';
import { createDepthIdentifier, type DepthIdentifier } from './helpers/DepthContext.js';
import type { Arity, EntityRelations, ProducedLinks, Strategy } from './interfaces/EntityGraphTypes.js';

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
function computeLinkIndexArbitrary(
  arity: Arity,
  strategy: Strategy,
  currentIndexIfSameType: number | undefined,
  countInTargetType: number,
  currentEntityDepth: DepthIdentifier,
): Arbitrary<number[] | number | undefined> {
  const linkArbitrary = produceLinkUnitaryIndexArbitrary(strategy, currentIndexIfSameType, countInTargetType);
  switch (arity) {
    case '0-1':
      return option(linkArbitrary, { nil: undefined, depthIdentifier: currentEntityDepth });
    case '1':
      return linkArbitrary;
    case 'many': {
      let randomUnicity = 0;
      return option(
        // given the depth does not control the size of an array, we cheat and use an option to do so
        uniqueArray(linkArbitrary, {
          depthIdentifier: currentEntityDepth, // passed just in case, but probably ignored by arrays
          selector: (v) => (v === countInTargetType ? v + ++randomUnicity : v),
          minLength: 1, // we handle length 0 with the option
        }),
        { nil: [], depthIdentifier: currentEntityDepth },
      ).map((values) => {
        let offset = 0;
        return safeMap(values, (v) => (v === countInTargetType ? v + offset++ : v));
      });
    }
  }
}

/** @internal */
function validateRelations<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
): void {
  // Basic sanity checks on the relations
  const nonExclusiveEntities = new SSet<keyof TEntityRelations>();
  const exclusiveEntities = new SSet<keyof TEntityRelations>();
  for (const name in relations) {
    const relationsForName = relations[name];
    for (const fieldName in relationsForName) {
      const relation = relationsForName[fieldName];
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
}

/** @internal */
type EntityQueueItem<TEntityFields> = { type: keyof TEntityFields; indexInType: number; depth: number };

/** @internal */
function processAllEntities<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
  producedLinks: ProducedLinks<TEntityFields, TEntityRelations>,
  toBeProducedEntities: EntityQueueItem<TEntityFields>[],
): Arbitrary<ProducedLinks<TEntityFields, TEntityRelations>> {
  // Process first entity, which will chain to processing remaining entities
  function processFrom(index: number): Arbitrary<ProducedLinks<TEntityFields, TEntityRelations>> {
    if (index >= toBeProducedEntities.length) {
      return constant(producedLinks);
    }

    const currentEntity = toBeProducedEntities[index];
    const currentRelations = relations[currentEntity.type];
    const currentProducedLinks = producedLinks[currentEntity.type];
    const currentLinks = currentProducedLinks[currentEntity.indexInType];
    const currentEntityDepth = createDepthIdentifier();
    currentEntityDepth.depth = currentEntity.depth;

    const relationFields = Object.keys(currentRelations) as (keyof typeof currentRelations)[];
    
    if (relationFields.length === 0) {
      return processFrom(index + 1);
    }

    const linkArbitraries: Arbitrary<number[] | number | undefined>[] = [];
    const relationInfo: Array<{
      name: keyof typeof currentRelations;
      targetType: keyof TEntityFields;
      countInTargetType: number;
    }> = [];

    for (const name of relationFields) {
      const relation = currentRelations[name];
      const targetType = relation.type;
      const producedLinksInTargetType = producedLinks[targetType];
      const countInTargetType = producedLinksInTargetType.length;
      
      relationInfo.push({ name, targetType, countInTargetType });
      
      linkArbitraries.push(
        computeLinkIndexArbitrary(
          relation.arity,
          relation.strategy || 'any',
          targetType === currentEntity.type ? currentEntity.indexInType : undefined,
          countInTargetType,
          currentEntityDepth,
        ),
      );
    }

    return tuple(...linkArbitraries).chain((linkIndices) => {
      for (let i = 0; i < linkIndices.length; i++) {
        const linkOrLinks = linkIndices[i];
        const { name, targetType, countInTargetType } = relationInfo[i];
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (currentLinks as any)[name as string] = { type: targetType, index: linkOrLinks };
        
        const links = linkOrLinks === undefined ? [] : typeof linkOrLinks === 'number' ? [linkOrLinks] : linkOrLinks;
        for (const link of links) {
          if (link >= countInTargetType) {
            const producedLinksInTargetType = producedLinks[targetType];
            safePush(toBeProducedEntities, { type: targetType, indexInType: link, depth: currentEntity.depth + 1 });
            safePush(producedLinksInTargetType, safeObjectCreate(null));
          }
        }
      }
      
      return processFrom(index + 1);
    });
  }

  return processFrom(0);
}

/** @internal */
export function onTheFlyLinksForEntityGraph<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
  defaultEntities: (keyof TEntityFields)[],
): Arbitrary<ProducedLinks<TEntityFields, TEntityRelations>> {
  // Validate relations upfront
  validateRelations(relations);

  // Return a constant arbitrary that, when chained, initializes state and processes entities
  return constant(undefined).chain(() => {
    // Initialize the producedLinks structure (fresh for each generate() call)
    const producedLinks: ProducedLinks<TEntityFields, TEntityRelations> = safeObjectCreate(null);
    for (const name in relations) {
      producedLinks[name as Extract<keyof TEntityFields, string>] = [];
    }

    // Initialize the queue with default entities
    const toBeProducedEntities: EntityQueueItem<TEntityFields>[] = [];
    for (const name of defaultEntities) {
      safePush(toBeProducedEntities, { type: name, indexInType: producedLinks[name].length, depth: 0 });
      safePush(producedLinks[name], safeObjectCreate(null));
    }

    // Start processing entities recursively using chain
    return processAllEntities(relations, producedLinks, toBeProducedEntities);
  });
}
