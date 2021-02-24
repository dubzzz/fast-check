import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { getDepthContextFor } from './OneOfArbitrary';

/** @internal */
type DepthContext = { depth: number };

/**
 * Conjonction of a weight and an arbitrary used by {@link frequency}
 * in order to generate values
 *
 * @remarks Since 1.18.0
 * @public
 */
export interface WeightedArbitrary<T> {
  /**
   * Weight to be applied when selecting which arbitrary should be used
   * @remarks Since 0.0.7
   */
  weight: number;
  /**
   * Instance of Arbitrary
   * @remarks Since 0.0.7
   */
  arbitrary: Arbitrary<T>;
}

/** @internal */
class FrequencyArbitrary<T> extends Arbitrary<T> {
  readonly summedWarbs: WeightedArbitrary<T>[];
  readonly totalWeight: number;

  static from<T>(warbs: WeightedArbitrary<T>[], constraints: FrequencyContraints) {
    if (warbs.length === 0) {
      throw new Error('fc.frequency expects at least one parameter');
    }
    let totalWeight = 0;
    for (let idx = 0; idx !== warbs.length; ++idx) {
      const currentWeight = warbs[idx].weight;
      totalWeight += currentWeight;
      if (currentWeight < 0) {
        throw new Error('fc.frequency expects weights to be superior or equal to 0');
      }
    }
    if (totalWeight <= 0) {
      throw new Error('fc.frequency expects the sum of weights to be strictly superior to 0');
    }
    if (constraints.withCrossShrink && warbs[0].weight === 0) {
      throw new Error('fc.frequency expects first arbitrary to be defined with a weight strictly superior to 0');
    }
    return new FrequencyArbitrary(warbs, constraints, getDepthContextFor(constraints.depthContext));
  }

  private constructor(
    readonly warbs: WeightedArbitrary<T>[],
    readonly constraints: FrequencyContraints,
    readonly context: DepthContext
  ) {
    super();
    let currentWeight = 0;
    this.summedWarbs = [];
    for (let idx = 0; idx !== warbs.length; ++idx) {
      currentWeight += warbs[idx].weight;
      this.summedWarbs.push({ weight: currentWeight, arbitrary: warbs[idx].arbitrary });
    }
    this.totalWeight = currentWeight;
  }

  generate(mrng: Random): Shrinkable<T> {
    const reachedMaxDepth = this.constraints.maxDepth !== undefined && this.constraints.maxDepth <= this.context.depth;
    const selected = reachedMaxDepth ? 0 : mrng.nextInt(-this.computeDepthBenefit(), this.totalWeight - 1);

    for (let idx = 0; idx !== this.summedWarbs.length; ++idx) {
      if (selected < this.summedWarbs[idx].weight) {
        ++this.context.depth; // increase depth
        const itemShrinkable = this.summedWarbs[idx].arbitrary.generate(mrng);
        --this.context.depth; // decrease depth (reset depth)

        if (idx === 0 || !this.constraints.withCrossShrink) {
          return itemShrinkable;
        }
        return this.enrichShrinkable(mrng.clone(), itemShrinkable);
      }
    }
    throw new Error(`Unable to generate from fc.frequency`);
  }

  /**
   * Enrich a shrinkable to add another shrink case into the list of possible ones:
   * shrink towards a value coming from the first arbitrary passed to frequency
   *
   * @param mrng Cloned instance of the random number generator (will be used later so might not be impacted by others)
   * @param shrinkable Shrinkable to be enriched
   */
  private enrichShrinkable(mrng: Random, shrinkable: Shrinkable<T>): Shrinkable<T> {
    let shrinkableForFirst: Shrinkable<T> | null = null;
    const getItemShrinkableForFirst = () => {
      if (shrinkableForFirst === null) {
        shrinkableForFirst = this.summedWarbs[0].arbitrary.generate(mrng);
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
    return Math.min(Math.pow(1 + depthBiasFactor, this.context.depth), Number.MAX_SAFE_INTEGER);
  }

  withBias(freq: number) {
    return new FrequencyArbitrary(
      this.warbs.map((v) => ({ weight: v.weight, arbitrary: v.arbitrary.withBias(freq) })),
      this.constraints,
      this.context
    );
  }
}

/**
 * Infer the type of the Arbitrary produced by {@link frequency}
 * given the type of the source arbitraries
 *
 * @remarks Since 2.2.0
 * @public
 */
export type FrequencyValue<Ts extends WeightedArbitrary<unknown>[]> = {
  [K in keyof Ts]: Ts[K] extends WeightedArbitrary<infer U> ? U : never;
}[number];

/**
 * Constraints to be applied on {@link frequency}
 * @public
 */
export type FrequencyContraints = {
  /**
   * When set to true, the shrinker of frequency will try to check if the first arbitrary
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
function isFrequencyContraints(
  param: FrequencyContraints | WeightedArbitrary<unknown> | undefined
): param is FrequencyContraints {
  return param != null && typeof param === 'object' && !('arbitrary' in param);
}

/**
 * For one of the values generated by `...warbs` - the probability of selecting the ith warb is of `warb[i].weight / sum(warb[j].weight)`.
 *
 * **WARNING**: It expects at least one (Arbitrary, weight)
 *
 * @param warbs - (Arbitrary, weight)s that might be called to produce a value
 *
 * @public
 */
function frequency<Ts extends WeightedArbitrary<unknown>[]>(...warbs: Ts): Arbitrary<FrequencyValue<Ts>>;
/**
 * For one of the values generated by `...warbs` - the probability of selecting the ith warb is of `warb[i].weight / sum(warb[j].weight)`.
 *
 * **WARNING**: It expects at least one (Arbitrary, weight)
 *
 * @param warbs - (Arbitrary, weight)s that might be called to produce a value
 *
 * @remarks Since 0.0.7
 * @public
 */
function frequency<Ts extends WeightedArbitrary<unknown>[]>(
  constraints: FrequencyContraints,
  ...warbs: Ts
): Arbitrary<FrequencyValue<Ts>>;
function frequency<Ts extends WeightedArbitrary<unknown>[]>(...args: Ts): Arbitrary<FrequencyValue<Ts>> {
  // TODO With TypeScript 4.0 it will be possible to properly define typings for `frequency(...arbs, constraints)`
  const constraints = args[0];
  if (isFrequencyContraints(constraints)) {
    return FrequencyArbitrary.from(args.slice(1) as WeightedArbitrary<FrequencyValue<Ts>>[], constraints);
  }
  return FrequencyArbitrary.from(args as WeightedArbitrary<FrequencyValue<Ts>>[], {});
}

export { frequency };
