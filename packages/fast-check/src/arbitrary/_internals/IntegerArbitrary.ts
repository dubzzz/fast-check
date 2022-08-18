import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { integerLogLike, biasNumericRange } from './helpers/BiasNumericRange';
import { shrinkInteger } from './helpers/ShrinkInteger';

const safeMathSign = Math.sign;

/** @internal */
export class IntegerArbitrary extends Arbitrary<number> {
  constructor(readonly min: number, readonly max: number) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<number> {
    const range = this.computeGenerateRange(mrng, biasFactor);
    return new Value(mrng.nextInt(range.min, range.max), undefined);
  }

  canShrinkWithoutContext(value: unknown): value is number {
    return (
      typeof value === 'number' &&
      Number.isInteger(value) &&
      !Object.is(value, -0) &&
      this.min <= value &&
      value <= this.max
    );
  }

  shrink(current: number, context?: unknown): Stream<Value<number>> {
    if (!IntegerArbitrary.isValidContext(current, context)) {
      // No context:
      //   Take default target and shrink towards it
      //   Try the target on first try
      const target = this.defaultTarget();
      return shrinkInteger(current, target, true);
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

  private defaultTarget(): number {
    // min <= 0 && max >= 0   => shrink towards zero
    if (this.min <= 0 && this.max >= 0) {
      return 0;
    }
    // min < 0                => shrink towards max (closer to zero)
    // otherwise              => shrink towards min (closer to zero)
    return this.min < 0 ? this.max : this.min;
  }

  private computeGenerateRange(mrng: Random, biasFactor: number | undefined): { min: number; max: number } {
    if (biasFactor === undefined || mrng.nextInt(1, biasFactor) !== 1) {
      return { min: this.min, max: this.max };
    }
    const ranges = biasNumericRange(this.min, this.max, integerLogLike);
    if (ranges.length === 1) {
      return ranges[0];
    }
    const id = mrng.nextInt(-2 * (ranges.length - 1), ranges.length - 2); // 1st range has the highest priority
    return id < 0 ? ranges[0] : ranges[id + 1];
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
