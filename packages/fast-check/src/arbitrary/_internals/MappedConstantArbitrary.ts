import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import type { Random } from '../../random/generator/Random.js';
import type { Stream } from '../../stream/Stream.js';
import { integerLogLike, biasNumericRange } from './helpers/BiasNumericRange.js';
import { IntegerArbitrary } from './IntegerArbitrary.js';

/** @internal */
type MappedConstantArbitraryContext = {
  originalValue: number;
  originalContext: unknown;
};

/**
 * Fused version of `nat({ max: numChoices - 1 }).map(mapper, unmapper)` dedicated to `mapToConstant`.
 * It generates the choice index and maps it to its constant in a single `generate`, without allocating
 * any intermediate `Value` for the index. It must stay byte-identical to the `nat().map()` version:
 * same random values for the same seed and bias factor, same shrinking behaviour.
 * @internal
 */
export class MappedConstantArbitrary<T> extends Arbitrary<T> {
  private readonly maxChoiceIndex: number;
  private readonly indexArbitrary: IntegerArbitrary;
  private readonly ranges: { min: number; max: number }[];
  private readonly bindMapIndexValue: (value: Value<number>) => Value<T>;
  constructor(
    numChoices: number,
    readonly mapper: (choiceIndex: number) => T,
    readonly unmapper: (value: unknown) => number,
  ) {
    super();
    this.maxChoiceIndex = numChoices - 1;
    // Delegating shrink-related logic to IntegerArbitrary to mimic nat({max: numChoices - 1})
    this.indexArbitrary = new IntegerArbitrary(0, this.maxChoiceIndex);
    // Precompute the ranges to be applied in case of biased generate (same as IntegerArbitrary)
    this.ranges = biasNumericRange(0, this.maxChoiceIndex, integerLogLike);
    this.bindMapIndexValue = (value: Value<number>): Value<T> => this.mapIndexValue(value);
  }

  private mapIndexValue(indexValue: Value<number>): Value<T> {
    // Indexes are numbers: they never have to be cloned, so no need for the clone-related
    // logic the generic `map` would apply on the source value
    return this.toMappedValue(indexValue.value_, indexValue.context);
  }

  private toMappedValue(index: number, indexContext: unknown): Value<T> {
    const context: MappedConstantArbitraryContext = { originalValue: index, originalContext: indexContext };
    return new Value(this.mapper(index), context);
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    // The index is drawn exactly as IntegerArbitrary.generate would have done it
    if (biasFactor === undefined || mrng.nextInt(1, biasFactor) !== 1) {
      return this.toMappedValue(mrng.nextInt(0, this.maxChoiceIndex), undefined);
    }
    const ranges = this.ranges;
    if (ranges.length === 1) {
      const range = ranges[0];
      return this.toMappedValue(mrng.nextInt(range.min, range.max), undefined);
    }
    const id = mrng.nextInt(-2 * (ranges.length - 1), ranges.length - 2);
    const range = id < 0 ? ranges[0] : ranges[id + 1]; // 1st range has the highest priority
    return this.toMappedValue(mrng.nextInt(range.min, range.max), undefined);
  }

  canShrinkWithoutContext(value: unknown): value is T {
    try {
      const unmapped = this.unmapper(value);
      return this.indexArbitrary.canShrinkWithoutContext(unmapped);
    } catch {
      return false;
    }
  }

  shrink(value: T, context?: unknown): Stream<Value<T>> {
    if (this.isSafeContext(context)) {
      return this.indexArbitrary.shrink(context.originalValue, context.originalContext).map(this.bindMapIndexValue);
    }
    // As `shrink` should never be called without a valid context
    // except if `canShrinkWithoutContext` tells that the value was compatible with a shrink without any context
    // we can safely consider `this.indexArbitrary.canShrinkWithoutContext(unmapped)` to be true at that point.
    return this.indexArbitrary.shrink(this.unmapper(value), undefined).map(this.bindMapIndexValue);
  }

  private isSafeContext(context: unknown): context is MappedConstantArbitraryContext {
    return (
      context !== null &&
      context !== undefined &&
      typeof context === 'object' &&
      'originalValue' in (context as any) &&
      'originalContext' in (context as any)
    );
  }
}
