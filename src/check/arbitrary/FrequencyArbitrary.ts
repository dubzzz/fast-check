import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';

/** @internal */
type DepthContext = {
  /** Current depth (starts at 0) */
  depth: number;
};

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
      throw new Error('fc.frequency expects at least one weigthed arbitrary');
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
    return new FrequencyArbitrary(warbs, constraints, { depth: 0 });
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
    if (this.constraints.maxDepth !== undefined && this.constraints.maxDepth <= this.context.depth) {
      // index=0 can be selected even if it has a weight equal to zero
      return this.safeGenerateForIndex(mrng, 0);
    }
    const selected = mrng.nextInt(-this.computeDepthBenefit(), this.totalWeight - 1);
    for (let idx = 0; idx !== this.summedWarbs.length; ++idx) {
      if (selected < this.summedWarbs[idx].weight) {
        return this.safeGenerateForIndex(mrng, idx);
      }
    }
    throw new Error(`Unable to generate from fc.frequency`);
  }
  withBias(freq: number) {
    return new FrequencyArbitrary(
      this.warbs.map((v) => ({ weight: v.weight, arbitrary: v.arbitrary.withBias(freq) })),
      this.constraints,
      this.context
    );
  }

  /** Generate using Arbitrary at index idx and safely handle depth context */
  private safeGenerateForIndex(mrng: Random, idx: number): Shrinkable<T> {
    ++this.context.depth; // increase depth
    try {
      const itemShrinkable = this.summedWarbs[idx].arbitrary.generate(mrng);
      if (idx === 0 || !this.constraints.withCrossShrink || this.warbs[0].weight === 0) {
        return itemShrinkable;
      }
      return this.enrichShrinkable(mrng.clone(), itemShrinkable);
    } finally {
      --this.context.depth; // decrease depth (reset depth)
    }
  }

  /** Compute the benefit for the current depth */
  private computeDepthBenefit(): number {
    const depthFactor = this.constraints.depthFactor;
    if (depthFactor === undefined || depthFactor <= 0) {
      return 0;
    }
    // We use a pow-based biased benefit as the deeper we go the more chance we have
    // to encounter thousands of instances of the current arbitrary.
    const depthBenefit = Math.floor(Math.pow(1 + depthFactor, this.context.depth)) - 1;
    return Math.min(this.warbs[0].weight * depthBenefit, Number.MAX_SAFE_INTEGER);
  }

  /**
   * Enrich a shrinkable to add another shrink case into the list of possible ones:
   * shrink towards a value coming from the first arbitrary passed to oneof
   * @param mrng Cloned instance of the random number generator (will be used later so might not be impacted by others)
   * @param shrinkable Shrinkable to be enriched
   */
  private enrichShrinkable(mrng: Random, shrinkable: Shrinkable<T>): Shrinkable<T> {
    let shrinkableForFirst: Shrinkable<T> | null = null;
    const getItemShrinkableForFirst = () => {
      if (shrinkableForFirst === null) {
        shrinkableForFirst = this.warbs[0].arbitrary.generate(mrng);
      }
      return shrinkableForFirst;
    };
    return new Shrinkable(shrinkable.value_, () => {
      return Stream.of(getItemShrinkableForFirst()).join(shrinkable.shrink());
    });
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
 * @remarks Since 2.14.0
 * @public
 */
export type FrequencyContraints = {
  /**
   * When set to true, the shrinker of frequency will try to check if the first arbitrary
   * could have been used to discover an issue. It allows to shrink trees.
   *
   * Warning: First arbitrary must be the one resulting in the smallest structures
   * for usages in deep tree-like structures.
   *
   * Warning: First arbitrary will not be used if its weight is set to zero.
   *
   * @remarks Since 2.14.0
   */
  withCrossShrink?: boolean;
  /**
   * While going deeper and deeper within a recursive structure,
   * this factor will be used to increase the probability to generate instances
   * of the first passed arbitrary.
   *
   * Example of values: 0.1 (small impact as depth increases), 0.5, 1 (huge impact as depth increases).
   *
   * Warning: First arbitrary will not be used if its weight is set to zero.
   *
   * @remarks Since 2.14.0
   */
  depthFactor?: number;
  /**
   * Maximal authorized depth.
   * Once this depth has been reached only the first arbitrary will be used.
   *
   * Warning: Contrary to others, first arbitrary will be used even if its weight is set to zero.
   *
   * @remarks Since 2.14.0
   */
  maxDepth?: number;
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
 * For one of the values generated by `...warbs` - the probability of selecting the ith warb is of `warb[i].weight / sum(warb[j].weight)`
 *
 * **WARNING**: It expects at least one (Arbitrary, weight)
 *
 * @param warbs - (Arbitrary, weight)s that might be called to produce a value
 *
 * @remarks Since 0.0.7
 * @public
 */
function frequency<Ts extends WeightedArbitrary<unknown>[]>(...warbs: Ts): Arbitrary<FrequencyValue<Ts>>;
/**
 * For one of the values generated by `...warbs` - the probability of selecting the ith warb is of `warb[i].weight / sum(warb[j].weight)`
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
function frequency<Ts extends WeightedArbitrary<unknown>[]>(
  ...args: [...Ts] | [FrequencyContraints, ...Ts]
): Arbitrary<FrequencyValue<Ts>> {
  // TODO With TypeScript 4.0 it will be possible to properly define typings for `frequency(...arbs, constraints)`
  const constraints = args[0];
  if (isFrequencyContraints(constraints)) {
    return FrequencyArbitrary.from(args.slice(1) as WeightedArbitrary<FrequencyValue<Ts>>[], constraints);
  }

  return FrequencyArbitrary.from(args as WeightedArbitrary<FrequencyValue<Ts>>[], {});
}

export { frequency };
