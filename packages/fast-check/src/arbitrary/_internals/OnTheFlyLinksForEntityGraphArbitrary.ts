import type { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
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
import { chainUntil } from '../chainUntil.js';
import { constant } from '../constant.js';
import { integer } from '../integer.js';
import { noBias } from '../noBias.js';
import { option } from '../option.js';
import { tuple } from '../tuple.js';
import { uniqueArray } from '../uniqueArray.js';
import { buildInversedRelationsMapping } from './helpers/BuildInversedRelationsMapping.js';
import { createDepthIdentifier, type DepthIdentifier } from './helpers/DepthContext.js';
import type { Arity, EntityLinks, EntityRelations, ProducedLinks, Strategy } from './interfaces/EntityGraphTypes.js';

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
function buildLinkIndexArbitrary(
  arity: Exclude<Arity, 'inverse'>,
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
type ToBeProducedEntity<TEntityFields> = { type: keyof TEntityFields; indexInType: number; depth: number };

/** @internal */
type ProductionState<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = {
  readonly producedLinks: ProducedLinks<TEntityFields, TEntityRelations>;
  readonly toBeProducedEntities: readonly ToBeProducedEntity<TEntityFields>[];
  readonly nextIndex: number;
};

/** @internal */
function createEmptyLinksInstanceFor<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
  targetType: keyof TEntityFields,
): EntityLinks<TEntityFields, TEntityRelations> {
  const emptyLinksInstance = safeObjectCreate(null);
  const relationsForType = relations[targetType];
  for (const name in relationsForType) {
    const relation = relationsForType[name];
    if (relation.arity === 'inverse') {
      emptyLinksInstance[name] = { type: relation.type, index: [] };
    }
  }
  return emptyLinksInstance;
}

/** @internal */
function buildEntityStepArbitrary<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
  inversedRelations: ReturnType<typeof buildInversedRelationsMapping<TEntityFields>>,
  state: ProductionState<TEntityFields, TEntityRelations>,
): Arbitrary<ProductionState<TEntityFields, TEntityRelations>> {
  const { producedLinks, toBeProducedEntities, nextIndex } = state;
  const currentEntity = toBeProducedEntities[nextIndex];
  const currentRelations = relations[currentEntity.type];
  const currentEntityDepth = createDepthIdentifier();
  currentEntityDepth.depth = currentEntity.depth;

  const countsInTargetType: { [name: string]: number } = safeObjectCreate(null);
  const subArbitraries: Arbitrary<number[] | number | undefined>[] = [];
  for (const name in currentRelations) {
    const relation = currentRelations[name];
    if (relation.arity === 'inverse') {
      continue;
    }
    const targetType = relation.type;
    const countInTargetType = producedLinks[targetType].length;
    countsInTargetType[name] = countInTargetType;
    subArbitraries.push(
      buildLinkIndexArbitrary(
        relation.arity,
        relation.strategy || 'any',
        targetType === currentEntity.type ? currentEntity.indexInType : undefined,
        countInTargetType,
        currentEntityDepth,
      ),
    );
  }

  return tuple<(number[] | number | undefined)[]>(...subArbitraries).map((results) => {
    const currentLinks = producedLinks[currentEntity.type][currentEntity.indexInType];
    let resultIndex = 0;
    let newToBeProducedEntities: ToBeProducedEntity<TEntityFields>[] | undefined = undefined;
    for (const name in currentRelations) {
      const relation = currentRelations[name];
      if (relation.arity === 'inverse') {
        continue;
      }
      const targetType = relation.type;
      const countInTargetType = countsInTargetType[name];
      const linkOrLinks = results[resultIndex++];
      const producedLinksInTargetType = producedLinks[targetType];
      currentLinks[name] = { type: targetType, index: linkOrLinks };
      const links = linkOrLinks === undefined ? [] : typeof linkOrLinks === 'number' ? [linkOrLinks] : linkOrLinks;
      for (const link of links) {
        if (link >= countInTargetType) {
          if (newToBeProducedEntities === undefined) {
            newToBeProducedEntities = [...toBeProducedEntities];
          }
          safePush(newToBeProducedEntities, { type: targetType, indexInType: link, depth: currentEntity.depth + 1 }); // indexInType should be equal to producedLinksInTargetType.length
          safePush(producedLinksInTargetType, createEmptyLinksInstanceFor(relations, targetType));
        }
        const inversed = safeMapGet(inversedRelations, relation);
        if (inversed !== undefined) {
          const knownInversedLinks = producedLinksInTargetType[link][inversed.property].index;
          safePush(knownInversedLinks as number[], currentEntity.indexInType);
        }
      }
    }
    return {
      producedLinks,
      toBeProducedEntities: newToBeProducedEntities !== undefined ? newToBeProducedEntities : toBeProducedEntities,
      nextIndex: nextIndex + 1,
    };
  });
}

/** @internal */
export function assertAcceptableRelations<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
): void {
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
}

/** @internal */
function buildInitialProductionState<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
  defaultEntities: (keyof TEntityFields)[],
): ProductionState<TEntityFields, TEntityRelations> {
  const producedLinks: ProducedLinks<TEntityFields, TEntityRelations> = safeObjectCreate(null);
  for (const name in relations) {
    producedLinks[name as Extract<keyof TEntityFields, string>] = [];
  }
  const toBeProducedEntities: ToBeProducedEntity<TEntityFields>[] = [];
  for (const name of defaultEntities) {
    safePush(toBeProducedEntities, { type: name, indexInType: producedLinks[name].length, depth: 0 });
    safePush(producedLinks[name], createEmptyLinksInstanceFor(relations, name));
  }
  return { producedLinks, toBeProducedEntities, nextIndex: 0 };
}

/** @internal */
export function onTheFlyLinksForEntityGraph<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
  defaultEntities: (keyof TEntityFields)[],
): Arbitrary<ProducedLinks<TEntityFields, TEntityRelations>> {
  assertAcceptableRelations(relations);

  const inversedRelations = buildInversedRelationsMapping(relations);
  const initialStateArb = constant(buildInitialProductionState(relations, defaultEntities));
  return chainUntil(initialStateArb, (state) => {
    if (state.nextIndex >= state.toBeProducedEntities.length) {
      return undefined;
    }
    return buildEntityStepArbitrary(relations, inversedRelations, state);
  }).map((state) => state.producedLinks);
}
