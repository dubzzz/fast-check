import type { Random } from '../../random/generator/Random.js';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import { Stream } from '../../stream/Stream.js';
import {
  safeAdd,
  safeHas,
  safeMap,
  safeMapGet,
  safeMapSet,
  safePush,
  Map as SMap,
  Set as SSet,
  Error as SError,
  String as SString,
  safeSlice,
} from '../../utils/globals.js';
import { chainUntil } from '../chainUntil.js';
import { constant } from '../constant.js';
import { integer } from '../integer.js';
import { noBias } from '../noBias.js';
import { option } from '../option.js';
import { uniqueArray } from '../uniqueArray.js';
import { tupleShrink } from './TupleArbitrary.js';
import { buildInversedRelationsMapping } from './helpers/BuildInversedRelationsMapping.js';
import { createDepthIdentifier, type DepthIdentifier } from './helpers/DepthContext.js';
import type {
  Arity,
  EntityLinks,
  EntityRelations,
  ProducedLinks,
  ReadonlyEntityLinks,
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

/**
 * Pre-extracted details for one forward (ie non-inverse) relationship of a given entity type
 * @internal
 */
type ForwardRelationSetup<TEntityFields> = {
  name: string;
  arity: Exclude<Arity, 'inverse'>;
  strategy: Strategy;
  targetType: keyof TEntityFields;
  targetTypeIndex: number;
  inversedProperty: string | undefined;
};

/** @internal */
type ProductionMeta<TEntityFields> = {
  /** All the entity type names, in declaration order of `relations` */
  typeNames: Extract<keyof TEntityFields, string>[];
  /** Mapping from an entity type name onto its index within `typeNames` (and within per-state arrays) */
  indexOfType: Map<keyof TEntityFields, number>;
  /** For each entity type (same indexing as `typeNames`): the inverse relations to pre-fill on any newly created entity */
  inverseRelationTemplates: { name: string; type: keyof TEntityFields }[][];
  /** For each entity type (same indexing as `typeNames`): the pre-extracted forward relations to produce links for */
  forwardRelationsPerType: ForwardRelationSetup<TEntityFields>[][];
};

/** @internal */
function buildProductionMeta<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
): ProductionMeta<TEntityFields> {
  const inversedRelations = buildInversedRelationsMapping<TEntityFields>(relations);
  const typeNames: Extract<keyof TEntityFields, string>[] = [];
  const indexOfType = new SMap<keyof TEntityFields, number>();
  for (const name in relations) {
    const typeName = name as unknown as Extract<keyof TEntityFields, string>;
    safeMapSet(indexOfType, typeName, typeNames.length);
    safePush(typeNames, typeName);
  }
  const inverseRelationTemplates: { name: string; type: keyof TEntityFields }[][] = [];
  const forwardRelationsPerType: ForwardRelationSetup<TEntityFields>[][] = [];
  for (const name in relations) {
    const template: { name: string; type: keyof TEntityFields }[] = [];
    const forwardRelations: ForwardRelationSetup<TEntityFields>[] = [];
    const relationsForType = relations[name];
    for (const relationName in relationsForType) {
      const relation = relationsForType[relationName];
      if (relation.arity === 'inverse') {
        safePush(template, { name: relationName, type: relation.type });
      } else {
        const inversed = safeMapGet(inversedRelations, relation);
        safePush(forwardRelations, {
          name: relationName,
          arity: relation.arity,
          strategy: relation.strategy || 'any',
          targetType: relation.type,
          targetTypeIndex: safeMapGet(indexOfType, relation.type) as number,
          inversedProperty: inversed !== undefined ? inversed.property : undefined,
        });
      }
    }
    safePush(inverseRelationTemplates, template);
    safePush(forwardRelationsPerType, forwardRelations);
  }
  return { typeNames, indexOfType, inverseRelationTemplates, forwardRelationsPerType };
}

/** @internal */
function createEmptyLinksInstanceFor<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  meta: ProductionMeta<TEntityFields>,
  targetTypeIndex: number,
): EntityLinks<TEntityFields, TEntityRelations> {
  const emptyLinksInstance = safeObjectCreate(null);
  const template = meta.inverseRelationTemplates[targetTypeIndex];
  for (let templateIndex = 0; templateIndex !== template.length; ++templateIndex) {
    const entry = template[templateIndex];
    emptyLinksInstance[entry.name] = { type: entry.type, index: [] };
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
type ToBeProducedEntity<TEntityFields> = {
  type: keyof TEntityFields;
  typeIndex: number;
  indexInType: number;
  depth: number;
};

/** @internal */
type ProductionState<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> = {
  /** Per-type produced links, indexed according to `ProductionMeta.typeNames` */
  readonly producedLinks: ReadonlyArray<ReadonlyArray<ReadonlyEntityLinks<TEntityFields, TEntityRelations>>>;
  readonly toBeProducedEntities: ReadonlyArray<Readonly<ToBeProducedEntity<TEntityFields>>>;
  readonly nextIndex: number;
};

/**
 * Copy-on-write draft over a {@link ProductionState} able to absorb the edits of SEVERAL entities in a row.
 * The underlying state is cloned lazily (top-level array and inner structures) only once per batch: edits applied
 * for one entity of the batch stay visible to the next ones without any extra cloning.
 * Once `commit` has been called the draft must not be edited anymore: the committed state is immutable.
 * @internal
 */
class ProductionDraft<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>> {
  /** Per-type produced links as committed by the previous state — MUST never be mutated */
  private readonly basedOnProducedLinks: ReadonlyArray<
    ReadonlyArray<ReadonlyEntityLinks<TEntityFields, TEntityRelations>>
  >;
  /** Per-type produced links for the state being drafted — inner containers are copied-on-write from `basedOnProducedLinks` */
  private readonly producedLinks: EntityLinks<TEntityFields, TEntityRelations>[][];
  private readonly basedOnToBeProducedEntities: ReadonlyArray<Readonly<ToBeProducedEntity<TEntityFields>>>;
  private newToBeProducedEntities: ToBeProducedEntity<TEntityFields>[] | undefined;

  constructor(
    private readonly meta: ProductionMeta<TEntityFields>,
    state: ProductionState<TEntityFields, TEntityRelations>,
  ) {
    this.basedOnProducedLinks = state.producedLinks;
    // The top-level container being a simple array, cloning it per batch stays cheap whatever the number of types.
    this.producedLinks = safeSlice(state.producedLinks as EntityLinks<TEntityFields, TEntityRelations>[][]);
    this.basedOnToBeProducedEntities = state.toBeProducedEntities;
    this.newToBeProducedEntities = undefined;
  }

  private getOrCreateProducedLinksFor(typeIndex: number): EntityLinks<TEntityFields, TEntityRelations>[] {
    let producedLinksForType = this.producedLinks[typeIndex];
    if (producedLinksForType === this.basedOnProducedLinks[typeIndex]) {
      producedLinksForType = safeSlice(producedLinksForType);
      this.producedLinks[typeIndex] = producedLinksForType;
    }
    return producedLinksForType;
  }

  private getOrCreateLinksFor(typeIndex: number, indexInType: number): EntityLinks<TEntityFields, TEntityRelations> {
    const producedLinksForType = this.getOrCreateProducedLinksFor(typeIndex);
    let links = producedLinksForType[indexInType];
    if (links === this.basedOnProducedLinks[typeIndex][indexInType]) {
      links = safeObjectAssign(safeObjectCreate(null), links);
      producedLinksForType[indexInType] = links;
    }
    return links;
  }

  private getOrCreateRelationFor(
    typeIndex: number,
    indexInType: number,
    property: keyof TEntityRelations[keyof TEntityFields],
  ) {
    const links = this.getOrCreateLinksFor(typeIndex, indexInType);
    // `originalEntity` is `undefined` for entities just enqueued in this draft: they only exist in the cloned per-type array, not yet in `basedOnProducedLinks`.
    const originalEntity = this.basedOnProducedLinks[typeIndex][indexInType];
    if (originalEntity !== undefined && links[property] === originalEntity[property]) {
      const sharedRelation = links[property];
      // When `index` is an array, clone it — otherwise we'd keep sharing it (and mutating it) with the previous state.
      links[property] = {
        type: sharedRelation.type,
        index: typeof sharedRelation.index === 'object' ? safeSlice(sharedRelation.index) : sharedRelation.index,
      };
    }
    return links[property];
  }

  // Read functions
  countInType(typeIndex: number): number {
    return this.producedLinks[typeIndex].length;
  }

  countToBeProduced(): number {
    return this.newToBeProducedEntities !== undefined
      ? this.newToBeProducedEntities.length
      : this.basedOnToBeProducedEntities.length;
  }

  toBeProducedAt(entityIndex: number): Readonly<ToBeProducedEntity<TEntityFields>> {
    return this.newToBeProducedEntities !== undefined
      ? this.newToBeProducedEntities[entityIndex]
      : this.basedOnToBeProducedEntities[entityIndex];
  }

  // Edit functions
  setOutboundLink(
    currentEntity: Readonly<ToBeProducedEntity<TEntityFields>>,
    name: keyof TEntityRelations[keyof TEntityFields],
    value: {
      type: keyof TEntityFields;
      index: number[] | number | undefined;
    },
  ): void {
    // All the links going from the current entity to others
    const currentLinks = this.getOrCreateLinksFor(currentEntity.typeIndex, currentEntity.indexInType);
    currentLinks[name] = value;
  }

  enqueueNewEntity(
    currentEntity: Readonly<ToBeProducedEntity<TEntityFields>>,
    targetType: keyof TEntityFields,
    targetTypeIndex: number,
  ): number {
    const producedLinksInTargetType = this.getOrCreateProducedLinksFor(targetTypeIndex);
    const newEntityIndexInType = producedLinksInTargetType.length;
    if (this.newToBeProducedEntities === undefined) {
      this.newToBeProducedEntities = safeSlice(this.basedOnToBeProducedEntities as ToBeProducedEntity<TEntityFields>[]);
    }
    safePush(this.newToBeProducedEntities, {
      type: targetType,
      typeIndex: targetTypeIndex,
      indexInType: newEntityIndexInType,
      depth: currentEntity.depth + 1,
    });
    safePush(
      producedLinksInTargetType,
      createEmptyLinksInstanceFor<TEntityFields, TEntityRelations>(this.meta, targetTypeIndex),
    );
    return newEntityIndexInType;
  }

  appendBackReference(
    currentEntity: Readonly<ToBeProducedEntity<TEntityFields>>,
    targetTypeIndex: number,
    indexInType: number,
    property: string,
  ): void {
    const relation = this.getOrCreateRelationFor(targetTypeIndex, indexInType, property);
    const knownInversedLinks = relation.index;
    safePush(knownInversedLinks as Exclude<typeof knownInversedLinks, number | undefined>, currentEntity.indexInType);
  }

  // Seal the batch into a new immutable state pointing right after the last entity of the batch.
  commit(nextIndex: number): ProductionState<TEntityFields, TEntityRelations> {
    return {
      producedLinks: this.producedLinks,
      toBeProducedEntities:
        this.newToBeProducedEntities !== undefined ? this.newToBeProducedEntities : this.basedOnToBeProducedEntities,
      nextIndex,
    };
  }
}

/** @internal */
function buildInitialProductionState<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  meta: ProductionMeta<TEntityFields>,
  defaultEntities: (keyof TEntityFields)[],
): ProductionState<TEntityFields, TEntityRelations> {
  // The set of all produced links between entities.
  const producedLinks: EntityLinks<TEntityFields, TEntityRelations>[][] = [];
  for (let typeIndex = 0; typeIndex !== meta.typeNames.length; ++typeIndex) {
    safePush(producedLinks, []);
  }
  // Made of any entity whose links have to be created before building the whole graph.
  const toBeProducedEntities: ToBeProducedEntity<TEntityFields>[] = [];
  for (const name of defaultEntities) {
    const typeIndex = safeMapGet(meta.indexOfType, name) as number;
    safePush(toBeProducedEntities, { type: name, typeIndex, indexInType: producedLinks[typeIndex].length, depth: 0 });
    safePush(producedLinks[typeIndex], createEmptyLinksInstanceFor<TEntityFields, TEntityRelations>(meta, typeIndex));
  }
  return { producedLinks, toBeProducedEntities, nextIndex: 0 };
}

/** @internal */
type EntityLinkContext<TEntityFields> = {
  name: string;
  targetType: keyof TEntityFields;
  targetTypeIndex: number;
  sentinelLinkIndex: number;
  inversedProperty: string | undefined;
};

/**
 * Counts (or indexes within own type) at or above this bound do not get their per-entity
 * link arbitraries cached: they correspond to huge graphs unlikely to share their exact
 * parameterization again, caching them would only grow the cache forever.
 * @internal
 */
const maxCacheableCountInTargetType = 1024;

/**
 * Cache of {@link EntityLinksArbitrary} per entity type: nested sparse arrays indexed by the
 * counts in the target types of every forward relation (plus the index of the entity within its
 * own type for self-referencing relations), in relation order. Leaves hold the cached entries.
 * Integer-indexed arrays measured faster than string-keyed maps on this hot path.
 * @internal
 */
type EntityLinksArbitraryCache<TEntityFields> = (EntityLinksArbitrary<TEntityFields> | unknown[] | undefined)[][];

/** @internal */
type EntityStepResults = (number[] | number | undefined)[];

/**
 * Cached set of arbitraries responsible to produce all the outbound links of one single entity.
 * Two entities sharing the very same parameterization (same type, same counts in target types, same index
 * within own type) can safely share the very same instance: the only remaining degree of freedom, the depth
 * of the entity, has to be set onto `depthIdentifier` before any call to generate or shrink.
 * @internal
 */
type EntityLinksArbitrary<TEntityFields> = {
  subArbitraries: Arbitrary<number[] | number | undefined>[];
  linkContexts: EntityLinkContext<TEntityFields>[];
  depthIdentifier: DepthIdentifier;
};

/**
 * Build (or fetch from the cache) the arbitraries responsible to produce all the outbound links of one single entity.
 * Ranges are derived from the current content of the draft: callers must apply the results of an entity
 * onto the draft before requesting the arbitraries of the next one.
 * Must only be called for entities having at least one outbound link to produce.
 * @internal
 */
function buildEntityLinksArbitrary<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  meta: ProductionMeta<TEntityFields>,
  cache: EntityLinksArbitraryCache<TEntityFields>,
  draft: ProductionDraft<TEntityFields, TEntityRelations>,
  currentEntity: Readonly<ToBeProducedEntity<TEntityFields>>,
): EntityLinksArbitrary<TEntityFields> {
  const forwardRelations = meta.forwardRelationsPerType[currentEntity.typeIndex];
  const lastRelationIndex = forwardRelations.length - 1;
  // Cache walk: the full parameterization of the arbitraries except the depth (handled via the
  // mutable depthIdentifier) maps onto a path of integer indexes within nested sparse arrays
  let node: unknown[] | undefined = cache[currentEntity.typeIndex];
  let leafKey = 0;
  for (let relationIndex = 0; relationIndex !== forwardRelations.length; ++relationIndex) {
    const forwardRelation = forwardRelations[relationIndex];
    const countInTargetType = draft.countInType(forwardRelation.targetTypeIndex);
    if (countInTargetType >= maxCacheableCountInTargetType) {
      node = undefined; // never cached: build a fresh instance below
      break;
    }
    const selfReferencing = forwardRelation.targetTypeIndex === currentEntity.typeIndex;
    if (relationIndex !== lastRelationIndex) {
      node = ((node as unknown[])[countInTargetType] ??= []) as unknown[];
      if (selfReferencing) {
        node = (node[currentEntity.indexInType] ??= []) as unknown[];
      }
    } else if (selfReferencing) {
      node = ((node as unknown[])[countInTargetType] ??= []) as unknown[];
      leafKey = currentEntity.indexInType;
    } else {
      leafKey = countInTargetType;
    }
  }
  if (node !== undefined) {
    const cached = node[leafKey] as EntityLinksArbitrary<TEntityFields> | undefined;
    if (cached !== undefined) {
      return cached;
    }
  }
  const currentEntityDepth = createDepthIdentifier();
  currentEntityDepth.depth = currentEntity.depth;
  const subArbitraries: Arbitrary<number[] | number | undefined>[] = [];
  const linkContexts: EntityLinkContext<TEntityFields>[] = [];
  for (let relationIndex = 0; relationIndex !== forwardRelations.length; ++relationIndex) {
    const forwardRelation = forwardRelations[relationIndex];
    const { targetType, targetTypeIndex } = forwardRelation;
    const countInTargetType = draft.countInType(targetTypeIndex);
    const linkOrLinksArbitrary = buildLinkIndexArbitrary(
      forwardRelation.arity,
      forwardRelation.strategy,
      targetTypeIndex === currentEntity.typeIndex ? currentEntity.indexInType : undefined,
      countInTargetType, // upper bound doubles as the "create a new entity" marker — see the link >= countInTargetType branch below
      currentEntityDepth,
    );
    safePush(subArbitraries, linkOrLinksArbitrary);
    safePush(linkContexts, {
      name: forwardRelation.name,
      targetType,
      targetTypeIndex,
      sentinelLinkIndex: countInTargetType,
      inversedProperty: forwardRelation.inversedProperty,
    });
  }
  const entry: EntityLinksArbitrary<TEntityFields> = {
    subArbitraries,
    linkContexts,
    depthIdentifier: currentEntityDepth,
  };
  if (node !== undefined) {
    node[leafKey] = entry;
  }
  return entry;
}

/**
 * Apply onto the draft the links produced for one entity.
 * @internal
 */
function applyEntityLinks<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  draft: ProductionDraft<TEntityFields, TEntityRelations>,
  currentEntity: Readonly<ToBeProducedEntity<TEntityFields>>,
  results: EntityStepResults,
  linkContexts: EntityLinkContext<TEntityFields>[],
): void {
  for (let resultIndex = 0; resultIndex !== results.length; ++resultIndex) {
    const linkOrLinks = results[resultIndex];
    const linkContext = linkContexts[resultIndex];

    let index: number[] | number | undefined;
    if (linkOrLinks === undefined) {
      index = undefined;
    } else if (typeof linkOrLinks === 'number') {
      index = resolveOneEntityLink(draft, currentEntity, linkContext, linkOrLinks);
    } else {
      const effectiveLinks: number[] = [];
      for (let linkIndex = 0; linkIndex !== linkOrLinks.length; ++linkIndex) {
        safePush(effectiveLinks, resolveOneEntityLink(draft, currentEntity, linkContext, linkOrLinks[linkIndex]));
      }
      index = effectiveLinks;
    }
    draft.setOutboundLink(currentEntity, linkContext.name, { type: linkContext.targetType, index });
  }
}

/**
 * Resolve the effective index targeted by one link and register the back-reference when relevant.
 * @internal
 */
function resolveOneEntityLink<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  draft: ProductionDraft<TEntityFields, TEntityRelations>,
  currentEntity: Readonly<ToBeProducedEntity<TEntityFields>>,
  linkContext: EntityLinkContext<TEntityFields>,
  link: number,
): number {
  let newEntityIndexInType: number;
  if (link >= linkContext.sentinelLinkIndex) {
    // Links at or above sentinelLinkIndex mark "create a new entity"; enqueueNewEntity
    // allocates one and returns its index-in-type for later links to reuse.
    // Known limitation of current design: reuse is scoped to the current relation name
    // two relation names requesting a new entity of the same type get two separate entities.
    newEntityIndexInType = draft.enqueueNewEntity(currentEntity, linkContext.targetType, linkContext.targetTypeIndex);
  } else {
    newEntityIndexInType = link;
  }
  if (linkContext.inversedProperty !== undefined) {
    draft.appendBackReference(
      currentEntity,
      linkContext.targetTypeIndex,
      newEntityIndexInType,
      linkContext.inversedProperty,
    );
  }
  return newEntityIndexInType;
}

/**
 * One processed entity within a batch: enough material to replay or shrink the batch entity per entity.
 * @internal
 */
type EntityBatchRecord<TEntityFields> = {
  entityIndex: number;
  entity: Readonly<ToBeProducedEntity<TEntityFields>>;
  linksArbitrary: EntityLinksArbitrary<TEntityFields>;
  value: EntityStepResults;
  context: unknown;
  clonedMrng: Random;
};

/** @internal */
type EntityBatchStepContext<TEntityFields> = {
  biasFactor: number | undefined;
  records: EntityBatchRecord<TEntityFields>[];
  currentShrinkLevel: number;
};

/**
 * Arbitrary responsible to produce the links of ALL the entities pending at the time it gets created,
 * including the ones enqueued while running the batch itself (the whole graph is built in one batch).
 * It processes the entities sequentially against the very same mrng (each entity may impact the ranges
 * used by the next ones) but mutates one single shared draft instead of paying one full copy-on-write
 * clone and commit per entity.
 * @internal
 */
class EntityBatchStepArbitrary<
  TEntityFields,
  TEntityRelations extends EntityRelations<TEntityFields>,
> extends Arbitrary<ProductionState<TEntityFields, TEntityRelations>> {
  constructor(
    readonly meta: ProductionMeta<TEntityFields>,
    readonly linksArbitraryCache: EntityLinksArbitraryCache<TEntityFields>,
    readonly lastState: ProductionState<TEntityFields, TEntityRelations>,
  ) {
    super();
  }

  /**
   * Produce the links of one single entity by generating all its sub-arbitraries in order against mrng,
   * apply them onto the draft and append the freshly built record into records
   */
  private generateOneEntity(
    draft: ProductionDraft<TEntityFields, TEntityRelations>,
    records: EntityBatchRecord<TEntityFields>[],
    entityIndex: number,
    currentEntity: Readonly<ToBeProducedEntity<TEntityFields>>,
    mrng: Random,
    biasFactor: number | undefined,
  ): void {
    const linksArbitrary = buildEntityLinksArbitrary(this.meta, this.linksArbitraryCache, draft, currentEntity);
    linksArbitrary.depthIdentifier.depth = currentEntity.depth;
    const clonedMrng = mrng.clone();
    const subArbitraries = linksArbitrary.subArbitraries;
    // Equivalent of a generate on tuple(...subArbitraries) but without the cost of the wrapper:
    // sub-values are guaranteed to be numbers or arrays of numbers, they can never be cloneable
    const subValues: EntityStepResults = [];
    const subContexts: unknown[] = [];
    for (let index = 0; index !== subArbitraries.length; ++index) {
      const generated = subArbitraries[index].generate(mrng, biasFactor);
      safePush(subValues, generated.value_);
      safePush(subContexts, generated.context);
    }
    applyEntityLinks(draft, currentEntity, subValues, linksArbitrary.linkContexts);
    safePush(records, {
      entityIndex,
      entity: currentEntity,
      linksArbitrary,
      value: subValues,
      context: subContexts,
      clonedMrng,
    });
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<ProductionState<TEntityFields, TEntityRelations>> {
    const lastState = this.lastState;
    const forwardRelationsPerType = this.meta.forwardRelationsPerType;
    const draft = new ProductionDraft<TEntityFields, TEntityRelations>(this.meta, lastState);
    const records: EntityBatchRecord<TEntityFields>[] = [];
    // The batch covers all the pending entities, including the ones enqueued while running it
    for (let entityIndex = lastState.nextIndex; entityIndex !== draft.countToBeProduced(); ++entityIndex) {
      const currentEntity = draft.toBeProducedAt(entityIndex);
      if (forwardRelationsPerType[currentEntity.typeIndex].length === 0) {
        continue; // entity without any outbound link to produce
      }
      this.generateOneEntity(draft, records, entityIndex, currentEntity, mrng, biasFactor);
    }
    const context: EntityBatchStepContext<TEntityFields> = { biasFactor, records, currentShrinkLevel: 0 };
    return new Value(draft.commit(draft.countToBeProduced()), context);
  }

  canShrinkWithoutContext(_value: unknown): _value is ProductionState<TEntityFields, TEntityRelations> {
    return false;
  }

  shrink(
    _value: ProductionState<TEntityFields, TEntityRelations>,
    context?: unknown,
  ): Stream<Value<ProductionState<TEntityFields, TEntityRelations>>> {
    if (!this.isSafeContext(context)) {
      return Stream.nil();
    }
    return new Stream(this.shrinkIterator(context));
  }

  private *shrinkIterator(
    context: EntityBatchStepContext<TEntityFields>,
  ): IterableIterator<Value<ProductionState<TEntityFields, TEntityRelations>>> {
    const { records, currentShrinkLevel, biasFactor } = context;
    const lastState = this.lastState;

    for (let level = currentShrinkLevel; level < records.length; ++level) {
      const record = records[level];
      record.linksArbitrary.depthIdentifier.depth = record.entity.depth;
      const shrinks = tupleShrink(record.linksArbitrary.subArbitraries, record.value, record.context as unknown[]);

      for (const shrunkValue of shrinks) {
        const draft = new ProductionDraft<TEntityFields, TEntityRelations>(this.meta, lastState);
        const newRecords: EntityBatchRecord<TEntityFields>[] = safeSlice(records, 0, level);

        // Replay entities before this level unchanged (their stored link contexts stay valid:
        // the state they were derived from is replayed identically)
        for (let priorLevel = 0; priorLevel !== level; ++priorLevel) {
          const prior = records[priorLevel];
          applyEntityLinks(draft, prior.entity, prior.value, prior.linksArbitrary.linkContexts);
        }

        // Apply the shrunk entity at this level
        applyEntityLinks(draft, record.entity, shrunkValue.value_, record.linksArbitrary.linkContexts);
        safePush(newRecords, {
          entityIndex: record.entityIndex,
          entity: record.entity,
          linksArbitrary: record.linksArbitrary,
          value: shrunkValue.value_,
          context: shrunkValue.context,
          clonedMrng: record.clonedMrng,
        });

        // Regenerate the subsequent entities of the batch from the cloned mrng,
        // ranges being recomputed sequentially exactly as in generate
        const mrng = record.clonedMrng.clone();
        for (let entityIndex = record.entityIndex + 1; entityIndex !== draft.countToBeProduced(); ++entityIndex) {
          const nextEntity = draft.toBeProducedAt(entityIndex);
          if (this.meta.forwardRelationsPerType[nextEntity.typeIndex].length === 0) {
            continue;
          }
          this.generateOneEntity(draft, newRecords, entityIndex, nextEntity, mrng, biasFactor);
        }

        const newContext: EntityBatchStepContext<TEntityFields> = {
          biasFactor,
          records: newRecords,
          currentShrinkLevel: level,
        };
        yield new Value(draft.commit(draft.countToBeProduced()), newContext);
      }
    }
  }

  private isSafeContext(context: unknown): context is EntityBatchStepContext<TEntityFields> {
    return (
      context !== null &&
      context !== undefined &&
      typeof context === 'object' &&
      'biasFactor' in (context as any) &&
      'records' in (context as any) &&
      'currentShrinkLevel' in (context as any)
    );
  }
}

/**
 * Prepare a builder of arbitraries producing links between entities.
 *
 * All the computations only depending on `relations` (validation, inverse relationships mapping
 * and per entity type pre-extraction of the relationships) are performed once at preparation time,
 * so that the returned builder can be invoked on every generation without paying for them again.
 *
 * @internal
 */
export function onTheFlyLinksForEntityGraph<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  relations: TEntityRelations,
): (defaultEntities: (keyof TEntityFields)[]) => Arbitrary<ProducedLinks<TEntityFields, TEntityRelations>> {
  assertAcceptableRelations(relations);

  const meta = buildProductionMeta<TEntityFields, TEntityRelations>(relations);
  const forwardRelationsPerType = meta.forwardRelationsPerType;
  const linksArbitraryCache: EntityLinksArbitraryCache<TEntityFields> = [];
  for (let typeIndex = 0; typeIndex !== meta.typeNames.length; ++typeIndex) {
    safePush(linksArbitraryCache, []);
  }
  const nextEntityBatchStepArbitrary = (state: ProductionState<TEntityFields, TEntityRelations>) => {
    const toBeProducedEntities = state.toBeProducedEntities;
    for (let index = state.nextIndex; index < toBeProducedEntities.length; ++index) {
      // Types with at least one forward relation have outbound links to produce per entity:
      // entities of any other type can safely be skipped, they consume no randomness at all.
      if (forwardRelationsPerType[toBeProducedEntities[index].typeIndex].length !== 0) {
        // At least one pending entity has links to build: process all currently pending entities in one batch
        return new EntityBatchStepArbitrary(meta, linksArbitraryCache, state);
      }
    }
    return undefined;
  };
  const extractProducedLinks = (state: ProductionState<TEntityFields, TEntityRelations>) => {
    // Materialize the internal per-type arrays into the externally visible dictionary keyed by entity type names.
    const producedLinks: ProducedLinks<TEntityFields, TEntityRelations> = safeObjectCreate(null);
    const { typeNames } = meta;
    for (let typeIndex = 0; typeIndex !== typeNames.length; ++typeIndex) {
      producedLinks[typeNames[typeIndex]] = state.producedLinks[typeIndex] as EntityLinks<
        TEntityFields,
        TEntityRelations
      >[];
    }
    return producedLinks;
  };
  return (defaultEntities) => {
    const initialStateArb = constant(
      buildInitialProductionState<TEntityFields, TEntityRelations>(meta, defaultEntities),
    );
    return chainUntil(initialStateArb, nextEntityBatchStepArbitrary).map(extractProducedLinks);
  };
}
