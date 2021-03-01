import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';

/** @public */
export type DepthContext = { depth: number };

/** @internal - Never garbage collecting instances */
const depthContextCache = new Map<string, DepthContext>();

/** @internal */
export function getDepthContextFor(contextMeta: DepthContext | string | undefined): DepthContext {
  if (contextMeta === undefined) {
    return { depth: 0 };
  }
  if (typeof contextMeta !== 'string') {
    return contextMeta;
  }
  const cachedContext = depthContextCache.get(contextMeta);
  if (cachedContext !== undefined) {
    return cachedContext;
  }
  const context = { depth: 0 };
  depthContextCache.set(contextMeta, context);
  return context;
}

/** @internal */
class OneOfArbitrary<T> extends Arbitrary<T> {
  static from<T>(arbs: Arbitrary<T>[], constraints: OneOfContraints) {
    if (arbs.length === 0) {
      throw new Error('fc.oneof expects at least one parameter');
    }
    return new OneOfArbitrary(arbs, constraints, getDepthContextFor(constraints.depthContext));
  }

  private constructor(
    readonly arbs: Arbitrary<T>[],
    readonly constraints: OneOfContraints,
    readonly context: DepthContext
  ) {
    super();
  }

  generate(mrng: Random): Shrinkable<T> {
    const reachedMaxDepth = this.constraints.maxDepth !== undefined && this.constraints.maxDepth <= this.context.depth;
    const id = reachedMaxDepth ? 0 : Math.max(0, mrng.nextInt(-this.computeDepthBenefit(), this.arbs.length - 1));

    ++this.context.depth; // increase depth
    const itemShrinkable = this.arbs[id].generate(mrng);
    --this.context.depth; // decrease depth (reset depth)

    if (id === 0 || !this.constraints.withCrossShrink) {
      return itemShrinkable;
    }
    return this.enrichShrinkable(mrng.clone(), itemShrinkable);
  }

  /**
   * Enrich a shrinkable to add another shrink case into the list of possible ones:
   * shrink towards a value coming from the first arbitrary passed to oneof
   *
   * @param mrng Cloned instance of the random number generator (will be used later so might not be impacted by others)
   * @param shrinkable Shrinkable to be enriched
   */
  private enrichShrinkable(mrng: Random, shrinkable: Shrinkable<T>): Shrinkable<T> {
    let shrinkableForFirst: Shrinkable<T> | null = null;
    const getItemShrinkableForFirst = () => {
      if (shrinkableForFirst === null) {
        shrinkableForFirst = this.arbs[0].generate(mrng);
      }
      return shrinkableForFirst;
    };
    return new Shrinkable(shrinkable.value_, () => {
      return Stream.of(getItemShrinkableForFirst()).join(shrinkable.shrink());
    });
  }

  /** Compute the benefit for the current depth */
  private computeDepthBenefit(): number {
    const depthBiasFactor = this.constraints.depthBiasFactor;
    if (depthBiasFactor === undefined || depthBiasFactor <= 0) {
      return 0;
    }
    // We use a pow-based biased benefit as the deeper we go the more chance we have
    // to encounter thousands of instances of the current arbitrary.
    const depthFactor = Math.floor(Math.pow(1 + depthBiasFactor, this.context.depth)) - 1;
    return Math.min(depthFactor, Number.MAX_SAFE_INTEGER);
  }

  withBias(freq: number) {
    return new OneOfArbitrary(
      this.arbs.map((a) => a.withBias(freq)),
      this.constraints,
      this.context
    );
  }
}

/**
 * Infer the type of the Arbitrary produced by {@link oneof}
 * given the type of the source arbitraries
 *
 * @remarks Since 2.2.0
 * @public
 */
export type OneOfValue<Ts extends Arbitrary<unknown>[]> = {
  [K in keyof Ts]: Ts[K] extends Arbitrary<infer U> ? U : never;
}[number];

/**
 * Constraints to be applied on {@link oneof}
 * @public
 */
export type OneOfContraints = {
  /**
   * When set to true, the shrinker of oneof will try to check if the first arbitrary
   * could have been used to discover an issue. It allows to shrink trees.
   *
   * Warning: First arbitrary most be the one resulting in the smallest structures
   * for usages on deep tree-like structures.
   */
  withCrossShrink?: boolean;
  /**
   * While going deeper and deeper within a recursive structure,
   * this factor will be used to increase the probability to generate instances
   * of the first passed arbitrary
   */
  depthBiasFactor?: number;
  /**
   * Maximal authorized depth.
   * Once this depth has been reached only the first arbitrary will be used.
   */
  maxDepth?: number;
  /**
   * Context potentially shared with other entities.
   * If not provided, a context will be scoped on the instance.
   */
  depthContext?: DepthContext | string;
};

/**
 * @internal
 */
function isOneOfContraints(param: OneOfContraints | Arbitrary<unknown> | undefined): param is OneOfContraints {
  return param != null && typeof param === 'object' && !('generate' in param);
}

/**
 * For one of the values generated by `...arbs` - with all `...arbs` equiprobable.
 *
 * **WARNING**: It expects at least one arbitrary
 *
 * @param arbs - Arbitraries that might be called to produce a value
 *
 * @public
 */
function oneof<Ts extends Arbitrary<unknown>[]>(...arbs: Ts): Arbitrary<OneOfValue<Ts>>;
/**
 * For one of the values generated by `...arbs` - with all `...arbs` equiprobable.
 *
 * **WARNING**: It expects at least one arbitrary
 *
 * @param constraints - Constraints to be applied to oneof
 * @param arbs - Arbitraries that might be called to produce a value
 *
 * @remarks Since 0.0.1
 * @public
 */
function oneof<Ts extends Arbitrary<unknown>[]>(constraints: OneOfContraints, ...arbs: Ts): Arbitrary<OneOfValue<Ts>>;
function oneof<Ts extends Arbitrary<unknown>[]>(...args: Ts): Arbitrary<OneOfValue<Ts>> {
  // TODO With TypeScript 4.0 it will be possible to properly define typings for `oneof(...arbs, constraints)`
  const constraints = args[0];
  if (isOneOfContraints(constraints)) {
    return OneOfArbitrary.from(args.slice(1) as Arbitrary<OneOfValue<Ts>>[], constraints);
  }
  return OneOfArbitrary.from(args as Arbitrary<OneOfValue<Ts>>[], {});
}

export { oneof };
