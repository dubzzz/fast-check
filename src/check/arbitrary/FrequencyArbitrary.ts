import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { convertFromNext, convertToNext } from './definition/Converters';
import { NextArbitrary } from './definition/NextArbitrary';
import { NextValue } from './definition/NextValue';
import { DepthContext, getDepthContextFor } from './helpers/DepthContext';

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
interface WeightedNextArbitrary<T> {
  weight: number;
  arbitrary: NextArbitrary<T>;
}

/** @internal */
type FrequencyArbitraryContext<T> = {
  selectedIndex: number;
  originalBias: number | undefined;
  originalContext: unknown;
  clonedMrngForFallbackFirst: Random | null;
  cachedGeneratedForFirst?: NextValue<T>;
};

/** @internal */
export class FrequencyArbitrary<T> extends NextArbitrary<T> {
  readonly summedWarbs: WeightedNextArbitrary<T>[];
  readonly totalWeight: number;

  static from<T>(warbs: WeightedArbitrary<T>[], constraints: FrequencyContraints, label: string): Arbitrary<T> {
    if (warbs.length === 0) {
      throw new Error(`${label} expects at least one weigthed arbitrary`);
    }
    let totalWeight = 0;
    const warbsNext: WeightedNextArbitrary<T>[] = [];
    for (let idx = 0; idx !== warbs.length; ++idx) {
      const currentArbitrary = warbs[idx].arbitrary;
      if (currentArbitrary === undefined) {
        throw new Error(`${label} expects arbitraries to be specified`);
      }
      const currentWeight = warbs[idx].weight;
      totalWeight += currentWeight;
      if (!Number.isInteger(currentWeight)) {
        throw new Error(`${label} expects weights to be integer values`);
      }
      if (currentWeight < 0) {
        throw new Error(`${label} expects weights to be superior or equal to 0`);
      }
      warbsNext.push({ weight: currentWeight, arbitrary: convertToNext(currentArbitrary) });
    }
    if (totalWeight <= 0) {
      throw new Error(`${label} expects the sum of weights to be strictly superior to 0`);
    }
    return convertFromNext(
      new FrequencyArbitrary(warbsNext, constraints, getDepthContextFor(constraints.depthIdentifier))
    );
  }

  private constructor(
    readonly warbs: WeightedNextArbitrary<T>[],
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

  generate(mrng: Random, biasFactor: number | undefined): NextValue<T> {
    if (this.mustGenerateFirst()) {
      // index=0 can be selected even if it has a weight equal to zero
      return this.safeGenerateForIndex(mrng, 0, biasFactor);
    }
    const selected = mrng.nextInt(this.computeNegDepthBenefit(), this.totalWeight - 1);
    for (let idx = 0; idx !== this.summedWarbs.length; ++idx) {
      if (selected < this.summedWarbs[idx].weight) {
        return this.safeGenerateForIndex(mrng, idx, biasFactor);
      }
    }
    throw new Error(`Unable to generate from fc.frequency`);
  }

  canGenerate(value: unknown): value is T {
    return this.canGenerateIndex(value) !== -1;
  }

  shrink(value: T, context?: unknown): Stream<NextValue<T>> {
    if (context !== undefined) {
      const safeContext = context as FrequencyArbitraryContext<T>;
      const selectedIndex = safeContext.selectedIndex;
      const originalBias = safeContext.originalBias;
      const originalArbitrary = this.summedWarbs[selectedIndex].arbitrary;
      const originalShrinks = originalArbitrary
        .shrink(value, safeContext.originalContext)
        .map((v) => this.mapIntoNextValue(selectedIndex, v, null, originalBias));
      if (safeContext.clonedMrngForFallbackFirst !== null) {
        if (safeContext.cachedGeneratedForFirst === undefined) {
          safeContext.cachedGeneratedForFirst = this.safeGenerateForIndex(
            safeContext.clonedMrngForFallbackFirst,
            0,
            originalBias
          );
        }
        const valueFromFirst = safeContext.cachedGeneratedForFirst;
        return Stream.of(valueFromFirst).join(originalShrinks);
      }
      return originalShrinks;
    }
    const potentialSelectedIndex = this.canGenerateIndex(value);
    if (potentialSelectedIndex === -1) {
      return Stream.nil(); // No arbitrary found to accept this value
    }
    return this.summedWarbs[potentialSelectedIndex].arbitrary
      .shrink(value)
      .map((v) => this.mapIntoNextValue(potentialSelectedIndex, v, null, undefined));
  }

  /** Extract the index of the generator that would have been able to gennrate the value */
  private canGenerateIndex(value: unknown): number {
    ++this.context.depth; // increase depth
    try {
      if (this.mustGenerateFirst()) {
        return this.warbs[0].arbitrary.canGenerate(value) ? 0 : -1;
      }
      for (let idx = 0; idx !== this.warbs.length; ++idx) {
        const warb = this.warbs[idx];
        if (warb.weight !== 0 && warb.arbitrary.canGenerate(value)) {
          return idx;
        }
      }
      return -1;
    } finally {
      --this.context.depth; // decrease depth (reset depth)
    }
  }

  /** Map the output of one of the children with the context of frequency */
  private mapIntoNextValue(
    idx: number,
    value: NextValue<T>,
    clonedMrngForFallbackFirst: Random | null,
    biasFactor: number | undefined
  ): NextValue<T> {
    const context: FrequencyArbitraryContext<T> = {
      selectedIndex: idx,
      originalBias: biasFactor,
      originalContext: value.context,
      clonedMrngForFallbackFirst,
    };
    return new NextValue(value.value, context);
  }

  /** Generate using Arbitrary at index idx and safely handle depth context */
  private safeGenerateForIndex(mrng: Random, idx: number, biasFactor: number | undefined): NextValue<T> {
    ++this.context.depth; // increase depth
    try {
      const value = this.summedWarbs[idx].arbitrary.generate(mrng, biasFactor);
      const clonedMrngForFallbackFirst = this.mustFallbackToFirstInShrink(idx) ? mrng.clone() : null;
      return this.mapIntoNextValue(idx, value, clonedMrngForFallbackFirst, biasFactor);
    } finally {
      --this.context.depth; // decrease depth (reset depth)
    }
  }

  /** Check if generating a value based on the first arbitrary is compulsory */
  private mustGenerateFirst(): boolean {
    return this.constraints.maxDepth !== undefined && this.constraints.maxDepth <= this.context.depth;
  }

  /** Check if fallback on first arbitrary during shrinking is required */
  private mustFallbackToFirstInShrink(idx: number): boolean {
    return idx !== 0 && !!this.constraints.withCrossShrink && this.warbs[0].weight !== 0;
  }

  /** Compute the benefit for the current depth */
  private computeNegDepthBenefit(): number {
    const depthFactor = this.constraints.depthFactor;
    if (depthFactor === undefined || depthFactor <= 0) {
      return 0;
    }
    // We use a pow-based biased benefit as the deeper we go the more chance we have
    // to encounter thousands of instances of the current arbitrary.
    const depthBenefit = Math.floor(Math.pow(1 + depthFactor, this.context.depth)) - 1;
    // -0 has to be converted into 0 thus we call ||0
    return -Math.min(this.warbs[0].weight * depthBenefit, Number.MAX_SAFE_INTEGER) || 0;
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
   * While going deeper and deeper within a recursive structure (see {@link letrec}),
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
  /**
   * Depth identifier can be used to share the current depth between several instances.
   *
   * By default, if not specified, each instance of frequency will have its own depth.
   * In other words: you can have depth=1 in one while you have depth=100 in another one.
   *
   * @remarks Since 2.14.0
   */
  depthIdentifier?: string;
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
 * @param constraints - Constraints to be applied when generating the values
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
  const label = 'fc.frequency';
  const constraints = args[0];
  if (isFrequencyContraints(constraints)) {
    return FrequencyArbitrary.from(args.slice(1) as WeightedArbitrary<FrequencyValue<Ts>>[], constraints, label);
  }

  return FrequencyArbitrary.from(args as WeightedArbitrary<FrequencyValue<Ts>>[], {}, label);
}

export { frequency };
