import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import type { Random } from '../../random/generator/Random.js';
import { Stream } from '../../stream/Stream.js';
import { integerLogLike, biasNumericRange } from './helpers/BiasNumericRange.js';
import { shrinkInteger } from './helpers/ShrinkInteger.js';

const safeMathSign = Math.sign;
const safeNumberIsInteger = Number.isInteger;
const safeObjectIs = Object.is;

/** @internal */
export class IntegerArbitrary extends Arbitrary<number> {
  private readonly defaultTargetValue: number;
  private readonly ranges: { min: number; max: number }[];
  constructor(
    readonly min: number,
    readonly max: number,
  ) {
    super();
    // Precompute the default shrink target (depends only on min/max).
    // min <= 0 && max >= 0  => shrink towards zero
    // min < 0               => shrink towards max (closer to zero)
    // otherwise             => shrink towards min (closer to zero)
    this.defaultTargetValue = min <= 0 && max >= 0 ? 0 : min < 0 ? max : min;
    // Precompute the ranges to be applied in case of biased generate
    this.ranges = biasNumericRange(min, max, integerLogLike);
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<number> {
    if (biasFactor === undefined || mrng.nextInt(1, biasFactor) !== 1) {
      return new Value(mrng.nextInt(this.min, this.max), undefined);
    }
    const ranges = this.ranges;
    if (ranges.length === 1) {
      const range = ranges[0];
      return new Value(mrng.nextInt(range.min, range.max), undefined);
    }
    const id = mrng.nextInt(-2 * (ranges.length - 1), ranges.length - 2);
    const range = id < 0 ? ranges[0] : ranges[id + 1]; // 1st range has the highest priority
    return new Value(mrng.nextInt(range.min, range.max), undefined);
  }

  canShrinkWithoutContext(value: unknown): value is number {
    return (
      typeof value === 'number' &&
      safeNumberIsInteger(value) &&
      !safeObjectIs(value, -0) &&
      this.min <= value &&
      value <= this.max
    );
  }

  shrink(current: number, context?: unknown): Stream<Value<number>> {
    if (!IntegerArbitrary.isValidContext(current, context)) {
      // No context:
      //   Take default target and shrink towards it
      //   Try the target on first try
      return shrinkInteger(current, this.defaultTargetValue, true);
    }
    if (this.isLastChanceTry(current, context)) {
      // Last chance try...
      // context is set to undefined, so that shrink will restart
      // without any assumptions in case our try find yet another bug
      return Stream.of(new Value(context, undefined));
    }
    // Normal shrink process
    return shrinkInteger(current, context, false);
  }

  private isLastChanceTry(current: number, context: number): boolean {
    // If true...
    // We already reached what we thought to be the minimal failing value.
    // But in-between other values may have shrunk (values coming from other arbitraries).
    // In order to check if they impacted us, we just try to move very close to our current value.
    // It is not ideal but it can help restart a shrinking process that stopped too early.
    if (current > 0) return current === context + 1 && current > this.min;
    if (current < 0) return current === context - 1 && current < this.max;
    return false;
  }

  private static isValidContext(current: number, context?: unknown): context is number {
    // Context contains a value between zero and current that is known to be
    // the closer to zero passing value*.
    // *More precisely: our shrinker will not try something closer to zero
    if (context === undefined) {
      return false;
    }
    if (typeof context !== 'number') {
      throw new Error(`Invalid context type passed to IntegerArbitrary (#1)`);
    }
    if (context !== 0 && safeMathSign(current) !== safeMathSign(context)) {
      throw new Error(`Invalid context value passed to IntegerArbitrary (#2)`);
    }
    return true;
  }
}
