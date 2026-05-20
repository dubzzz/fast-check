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
  safeSlice,
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
  ReadonlyProducedLinks,
  Relationship,
  Strategy,
} from './interfaces/EntityGraphTypes.js';

const safeObjectAssign = Object.assign;
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
function assertAcceptableRelations<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
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
type ToBeProducedEntity<TEntityFields> = { type: keyof TEntityFields; indexInType: number; depth: number };

/** @internal */
type ProductionState<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = {
  readonly producedLinks: ReadonlyProducedLinks<TEntityFields, TEntityRelations>;
  readonly toBeProducedEntities: ReadonlyArray<Readonly<ToBeProducedEntity<TEntityFields>>>;
  readonly nextIndex: number;
};

/** @internal */
function draftNextProductionState<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  state: ProductionState<TEntityFields, TEntityRelations>,
) {
  const { producedLinks, toBeProducedEntities, nextIndex } = state;

  const newProducedLinks: ProducedLinks<TEntityFields, TEntityRelations> = safeObjectAssign(
    safeObjectCreate(null),
    producedLinks,
  );
  function getOrCreateProducedLinksFor(type: keyof TEntityFields) {
    if (newProducedLinks[type] === producedLinks[type]) {
      newProducedLinks[type] = safeSlice(producedLinks[type] as (typeof newProducedLinks)[typeof type]);
    }
    return newProducedLinks[type];
  }
  function getOrCreateLinksFor(type: keyof TEntityFields, indexInType: number) {
    const producedLinksForType = getOrCreateProducedLinksFor(type);
    if (producedLinksForType[indexInType] === producedLinks[type][indexInType]) {
      producedLinksForType[indexInType] = safeObjectAssign(safeObjectCreate(null), producedLinks[type][indexInType]);
    }
    return producedLinksForType[indexInType];
  }
  function getOrCreateRelationFor(
    type: keyof TEntityFields,
    indexInType: number,
    property: keyof TEntityRelations[keyof TEntityFields],
  ) {
    const links = getOrCreateLinksFor(type, indexInType);
    // `originalEntity` is `undefined` when the entity was just enqueued in this same draft via `enqueueNewEntity`:
    // such entities only live in the cloned per-type array, not in the original `producedLinks` — in that case
    // `links` is the brand-new instance from `createEmptyLinksInstanceFor` and nothing is shared with a previous state.
    const originalEntity = producedLinks[type][indexInType];
    const sharedRelation = links[property];
    if (originalEntity !== undefined && sharedRelation === originalEntity[property]) {
      // `index` is the only field that can carry a shared mutable reference: when it is an array we must
      // shallow-clone it; in every other case (`number` or `undefined`) the primitive can be reused as-is.
      links[property] = {
        type: sharedRelation.type,
        index: typeof sharedRelation.index === 'object' ? safeSlice(sharedRelation.index) : sharedRelation.index,
      };
    }
    return links[property];
  }

  let newToBeProducedEntities: ToBeProducedEntity<TEntityFields>[] | undefined = undefined;

  const toBeProduced = toBeProducedEntities[nextIndex];
  return {
    // The entity being produced in this step. Exposed as a value (not a setter) since it cannot be mutated from here.
    getCurrentEntity: (): Readonly<ToBeProducedEntity<TEntityFields>> => toBeProduced,
    // Number of entities of the given type already produced so far.
    getExistingEntityCount: (targetType: keyof TEntityFields) => newProducedLinks[targetType].length,
    // Edit functions
    setOutboundLink: (
      name: keyof TEntityRelations[keyof TEntityFields],
      value: {
        type: keyof TEntityFields;
        index: number[] | number | undefined;
      },
    ) => {
      const currentLinks = getOrCreateLinksFor(toBeProduced.type, toBeProduced.indexInType); // All the links going from the current entity to others
      currentLinks[name] = value;
    },
    enqueueNewEntity: (relations: TEntityRelations, targetType: keyof TEntityFields) => {
      const producedLinksInTargetType = getOrCreateProducedLinksFor(targetType);
      if (newToBeProducedEntities === undefined) {
        newToBeProducedEntities = safeSlice(toBeProducedEntities as (typeof toBeProducedEntities)[number][]);
      }
      safePush(newToBeProducedEntities, {
        type: targetType,
        indexInType: producedLinksInTargetType.length,
        depth: toBeProduced.depth + 1,
      });
      safePush(producedLinksInTargetType, createEmptyLinksInstanceFor(relations, targetType));
    },
    appendBackReference: (targetType: keyof TEntityFields, indexInType: number, property: string) => {
      const relation = getOrCreateRelationFor(targetType, indexInType, property);
      const knownInversedLinks = relation.index;
      safePush(knownInversedLinks as Exclude<typeof knownInversedLinks, number | undefined>, toBeProduced.indexInType);
    },
    // Seal the step into a new immutable state and advance to the next entity.
    commit: (): ProductionState<TEntityFields, TEntityRelations> => ({
      producedLinks: newProducedLinks,
      toBeProducedEntities: newToBeProducedEntities !== undefined ? newToBeProducedEntities : toBeProducedEntities,
      nextIndex: nextIndex + 1,
    }),
  };
}

/** @internal */
function buildInitialProductionState<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
  defaultEntities: (keyof TEntityFields)[],
): ProductionState<TEntityFields, TEntityRelations> {
  // The set of all produced links between entities.
  const producedLinks: ProducedLinks<TEntityFields, TEntityRelations> = safeObjectCreate(null);
  for (const name in relations) {
    producedLinks[name as Extract<keyof TEntityFields, string>] = [];
  }
  // Made of any entity whose links have to be created before building the whole graph.
  const toBeProducedEntities: { type: keyof TEntityFields; indexInType: number; depth: number }[] = [];
  for (const name of defaultEntities) {
    safePush(toBeProducedEntities, { type: name, indexInType: producedLinks[name].length, depth: 0 });
    safePush(producedLinks[name], createEmptyLinksInstanceFor(relations, name));
  }
  return { producedLinks, toBeProducedEntities, nextIndex: 0 };
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
    assertAcceptableRelations(relations);

    // Building inversed relations map
    this.inversedRelations = buildInversedRelationsMapping(relations);
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<ProducedLinks<TEntityFields, TEntityRelations>> {
    let lastState = buildInitialProductionState(this.relations, this.defaultEntities);

    // Ideally toBeProducedEntities should be a queue, but given JavaScript built-ins arrays perform badly in queue mode,
    // we decided to consider an always growing array that will grow up to the numer of entities before being dropped.
    while (lastState.nextIndex < lastState.toBeProducedEntities.length) {
      const state = draftNextProductionState(lastState);
      const currentEntity = state.getCurrentEntity();
      const currentRelations = this.relations[currentEntity.type];
      const currentEntityDepth = createDepthIdentifier();
      currentEntityDepth.depth = currentEntity.depth;
      for (const name in currentRelations) {
        const relation = currentRelations[name];
        if (relation.arity === 'inverse') {
          continue;
        }
        const targetType = relation.type;
        const countInTargetType = state.getExistingEntityCount(targetType);
        const linkOrLinksArbitrary = buildLinkIndexArbitrary(
          relation.arity,
          relation.strategy || 'any',
          targetType === currentEntity.type ? currentEntity.indexInType : undefined,
          countInTargetType, // upper bound doubles as the "create a new entity" marker — see the link >= countInTargetType branch below
          currentEntityDepth,
        );
        const linkOrLinks = linkOrLinksArbitrary.generate(mrng, biasFactor).value;
        state.setOutboundLink(name, { type: targetType, index: linkOrLinks });
        const links = linkOrLinks === undefined ? [] : typeof linkOrLinks === 'number' ? [linkOrLinks] : linkOrLinks;
        for (const link of links) {
          if (link >= countInTargetType) {
            state.enqueueNewEntity(this.relations, targetType);
          }
          const inversed = safeMapGet(this.inversedRelations, relation);
          if (inversed !== undefined) {
            state.appendBackReference(targetType, link, inversed.property);
          }
        }
      }
      lastState = state.commit();
    }

    const readOnlyProducedLinks: ReadonlyProducedLinks<TEntityFields, TEntityRelations> = lastState.producedLinks;
    return new Value(readOnlyProducedLinks as ProducedLinks<TEntityFields, TEntityRelations>, undefined);
  }

  canShrinkWithoutContext(_value: unknown): _value is ProducedLinks<TEntityFields, TEntityRelations> {
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
