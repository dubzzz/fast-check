import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { DepthContext, DepthIdentifier, getDepthContextFor } from './helpers/DepthContext';
import { depthFactorFromSizeForArbitrary, DepthFactorSizeForArbitrary } from './helpers/MaxLengthFromMinLength';

/** @internal */
export class FrequencyArbitrary<T> extends Arbitrary<T> {
  readonly cumulatedWeights: number[];
  readonly totalWeight: number;

  static from<T>(warbs: _WeightedArbitrary<T>[], constraints: _Constraints, label: string): Arbitrary<T> {
    if (warbs.length === 0) {
      throw new Error(`${label} expects at least one weighted arbitrary`);
    }
    let totalWeight = 0;
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
    }
    if (totalWeight <= 0) {
      throw new Error(`${label} expects the sum of weights to be strictly superior to 0`);
    }
    const sanitizedConstraints: _SanitizedConstraints = {
      depthFactor: depthFactorFromSizeForArbitrary(constraints.depthFactor, constraints.maxDepth !== undefined),
      depthIdentifier: constraints.depthIdentifier,
      maxDepth: constraints.maxDepth,
      withCrossShrink: constraints.withCrossShrink,
    };
    return new FrequencyArbitrary(warbs, sanitizedConstraints, getDepthContextFor(constraints.depthIdentifier));
  }

  private constructor(
    readonly warbs: _WeightedArbitrary<T>[],
    readonly constraints: _SanitizedConstraints,
    readonly context: DepthContext
  ) {
    super();
    let currentWeight = 0;
    this.cumulatedWeights = [];
    for (let idx = 0; idx !== warbs.length; ++idx) {
      currentWeight += warbs[idx].weight;
      this.cumulatedWeights.push(currentWeight);
    }
    this.totalWeight = currentWeight;
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    if (this.mustGenerateFirst()) {
      // index=0 can be selected even if it has a weight equal to zero
      return this.safeGenerateForIndex(mrng, 0, biasFactor);
    }
    const selected = mrng.nextInt(this.computeNegDepthBenefit(), this.totalWeight - 1);
    for (let idx = 0; idx !== this.cumulatedWeights.length; ++idx) {
      if (selected < this.cumulatedWeights[idx]) {
        return this.safeGenerateForIndex(mrng, idx, biasFactor);
      }
    }
    throw new Error(`Unable to generate from fc.frequency`);
  }

  canShrinkWithoutContext(value: unknown): value is T {
    return this.canShrinkWithoutContextIndex(value) !== -1;
  }

  shrink(value: T, context?: unknown): Stream<Value<T>> {
    if (context !== undefined) {
      const safeContext = context as _FrequencyArbitraryContext<T>;
      const selectedIndex = safeContext.selectedIndex;
      const originalBias = safeContext.originalBias;
      const originalArbitrary = this.warbs[selectedIndex].arbitrary;
      const originalShrinks = originalArbitrary
        .shrink(value, safeContext.originalContext)
        .map((v) => this.mapIntoValue(selectedIndex, v, null, originalBias));
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
    return this.defaultShrinkForFirst(potentialSelectedIndex).join(
      this.warbs[potentialSelectedIndex].arbitrary
        .shrink(value, undefined) // re-checked by canShrinkWithoutContextIndex
        .map((v) => this.mapIntoValue(potentialSelectedIndex, v, null, undefined))
    );
  }

  /** Generate shrink values for first arbitrary when no context and no value was provided */
  private defaultShrinkForFirst(selectedIndex: number): Stream<Value<T>> {
    ++this.context.depth; // increase depth
    try {
      if (!this.mustFallbackToFirstInShrink(selectedIndex) || this.warbs[0].fallbackValue === undefined) {
        // Not applicable: no fallback to first arbitrary on shrink OR no hint to shrink without an initial value and context
        return Stream.nil();
      }
    } finally {
      --this.context.depth; // decrease depth (reset depth)
    }
    // The arbitrary at [0] accepts to shrink fallbackValue.default without any context (context=undefined)
    const rawShrinkValue = new Value(this.warbs[0].fallbackValue.default, undefined);
    return Stream.of(this.mapIntoValue(0, rawShrinkValue, null, undefined));
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
  private mapIntoValue(
    idx: number,
    value: Value<T>,
    clonedMrngForFallbackFirst: Random | null,
    biasFactor: number | undefined
  ): Value<T> {
    const context: _FrequencyArbitraryContext<T> = {
      selectedIndex: idx,
      originalBias: biasFactor,
      originalContext: value.context,
      clonedMrngForFallbackFirst,
    };
    return new Value(value.value, context);
  }

  /** Generate using Arbitrary at index idx and safely handle depth context */
  private safeGenerateForIndex(mrng: Random, idx: number, biasFactor: number | undefined): Value<T> {
    ++this.context.depth; // increase depth
    try {
      const value = this.warbs[idx].arbitrary.generate(mrng, biasFactor);
      const clonedMrngForFallbackFirst = this.mustFallbackToFirstInShrink(idx) ? mrng.clone() : null;
      return this.mapIntoValue(idx, value, clonedMrngForFallbackFirst, biasFactor);
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
    if (depthFactor === undefined || depthFactor <= 0 || this.warbs[0].weight === 0) {
      return 0;
    }
    // We use a pow-based biased benefit as the deeper we go the more chance we have
    // to encounter thousands of instances of the current arbitrary.
    const depthBenefit = Math.floor(Math.pow(1 + depthFactor, this.context.depth)) - 1;
    // -0 has to be converted into 0 thus we call ||0
    return -Math.min(this.totalWeight * depthBenefit, Number.MAX_SAFE_INTEGER) || 0;
  }
}

/** @internal */
export type _Constraints = {
  withCrossShrink?: boolean;
  depthFactor?: DepthFactorSizeForArbitrary;
  maxDepth?: number;
  depthIdentifier?: DepthIdentifier | string;
};

/** @internal */
export type _SanitizedConstraints = {
  withCrossShrink: boolean | undefined;
  depthFactor: number | undefined;
  maxDepth: number | undefined;
  depthIdentifier: DepthIdentifier | string | undefined;
};

/** @internal */
interface _WeightedArbitrary<T> {
  weight: number;
  arbitrary: Arbitrary<T>;
  // If specified, the arbitrary must accept to shrink fallbackValue.default without any context
  fallbackValue?: { default: T };
}

/** @internal */
type _FrequencyArbitraryContext<T> = {
  selectedIndex: number;
  originalBias: number | undefined;
  originalContext: unknown;
  clonedMrngForFallbackFirst: Random | null;
  cachedGeneratedForFirst?: Value<T>;
};
