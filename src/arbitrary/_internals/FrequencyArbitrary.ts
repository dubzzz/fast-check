import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../../check/arbitrary/definition/Converters';
import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { DepthContext, getDepthContextFor } from './helpers/DepthContext';

/** @internal */
export class FrequencyArbitrary<T> extends NextArbitrary<T> {
  readonly summedWarbs: _WeightedNextArbitrary<T>[];
  readonly totalWeight: number;

  static fromOld<T>(warbs: _WeightedArbitrary<T>[], constraints: _Constraints, label: string): Arbitrary<T> {
    return convertFromNext(
      FrequencyArbitrary.from(
        warbs.map((w) => ({ ...w, arbitrary: convertToNext(w.arbitrary) })),
        constraints,
        label
      )
    );
  }

  static from<T>(warbs: _WeightedNextArbitrary<T>[], constraints: _Constraints, label: string): NextArbitrary<T> {
    if (warbs.length === 0) {
      throw new Error(`${label} expects at least one weigthed arbitrary`);
    }
    let totalWeight = 0;
    const warbsNext: _WeightedNextArbitrary<T>[] = [];
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
      warbsNext.push({ weight: currentWeight, arbitrary: currentArbitrary });
    }
    if (totalWeight <= 0) {
      throw new Error(`${label} expects the sum of weights to be strictly superior to 0`);
    }
    return new FrequencyArbitrary(warbsNext, constraints, getDepthContextFor(constraints.depthIdentifier));
  }

  private constructor(
    readonly warbs: _WeightedNextArbitrary<T>[],
    readonly constraints: _Constraints,
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

  canShrinkWithoutContext(value: unknown): value is T {
    return this.canShrinkWithoutContextIndex(value) !== -1;
  }

  shrink(value: T, context?: unknown): Stream<NextValue<T>> {
    if (context !== undefined) {
      const safeContext = context as _FrequencyArbitraryContext<T>;
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
    const potentialSelectedIndex = this.canShrinkWithoutContextIndex(value);
    if (potentialSelectedIndex === -1) {
      return Stream.nil(); // No arbitrary found to accept this value
    }
    return this.summedWarbs[potentialSelectedIndex].arbitrary
      .shrink(value)
      .map((v) => this.mapIntoNextValue(potentialSelectedIndex, v, null, undefined));
  }

  /** Extract the index of the generator that would have been able to gennrate the value */
  private canShrinkWithoutContextIndex(value: unknown): number {
    if (this.mustGenerateFirst()) {
      return this.warbs[0].arbitrary.canShrinkWithoutContext(value) ? 0 : -1;
    }
    try {
      ++this.context.depth; // increase depth
      for (let idx = 0; idx !== this.warbs.length; ++idx) {
        const warb = this.warbs[idx];
        if (warb.weight !== 0 && warb.arbitrary.canShrinkWithoutContext(value)) {
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
    const context: _FrequencyArbitraryContext<T> = {
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

/** @internal */
export type _Constraints = {
  withCrossShrink?: boolean;
  depthFactor?: number;
  maxDepth?: number;
  depthIdentifier?: string;
};

/** @internal */
interface _WeightedArbitrary<T> {
  weight: number;
  arbitrary: Arbitrary<T>;
}

/** @internal */
interface _WeightedNextArbitrary<T> {
  weight: number;
  arbitrary: NextArbitrary<T>;
}

/** @internal */
type _FrequencyArbitraryContext<T> = {
  selectedIndex: number;
  originalBias: number | undefined;
  originalContext: unknown;
  clonedMrngForFallbackFirst: Random | null;
  cachedGeneratedForFirst?: NextValue<T>;
};
