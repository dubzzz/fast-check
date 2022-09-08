import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { biasNumericRange, bigIntLogLike } from './helpers/BiasNumericRange';
import { shrinkBigInt } from './helpers/ShrinkBigInt';

const SBigInt = BigInt;

/** @internal */
export class BigIntArbitrary extends Arbitrary<bigint> {
  constructor(readonly min: bigint, readonly max: bigint) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<bigint> {
    const range = this.computeGenerateRange(mrng, biasFactor);
    return new Value(mrng.nextBigInt(range.min, range.max), undefined);
  }
  private computeGenerateRange(mrng: Random, biasFactor: number | undefined): { min: bigint; max: bigint } {
    if (biasFactor === undefined || mrng.nextInt(1, biasFactor) !== 1) {
      return { min: this.min, max: this.max };
    }
    const ranges = biasNumericRange(this.min, this.max, bigIntLogLike);
    if (ranges.length === 1) {
      return ranges[0];
    }
    const id = mrng.nextInt(-2 * (ranges.length - 1), ranges.length - 2); // 1st range has the highest priority
    return id < 0 ? ranges[0] : ranges[id + 1];
  }

  canShrinkWithoutContext(value: unknown): value is bigint {
    return typeof value === 'bigint' && this.min <= value && value <= this.max;
  }

  shrink(current: bigint, context?: unknown): Stream<Value<bigint>> {
    if (!BigIntArbitrary.isValidContext(current, context)) {
      // No context:
      //   Take default target and shrink towards it
      //   Try the target on first try
      const target = this.defaultTarget();
      return shrinkBigInt(current, target, true);
    }
    if (this.isLastChanceTry(current, context)) {
      // Last chance try...
      // context is set to undefined, so that shrink will restart
      // without any assumptions in case our try find yet another bug
      return Stream.of(new Value(context, undefined));
    }
    // Normal shrink process
    return shrinkBigInt(current, context, false);
  }

  private defaultTarget(): bigint {
    // min <= 0 && max >= 0   => shrink towards zero
    if (this.min <= 0 && this.max >= 0) {
      return SBigInt(0);
    }
    // min < 0                => shrink towards max (closer to zero)
    // otherwise              => shrink towards min (closer to zero)
    return this.min < 0 ? this.max : this.min;
  }

  private isLastChanceTry(current: bigint, context: bigint): boolean {
    // Last chance corresponds to scenario where shrink should be empty
    // But we try a last thing just in case it can work
    if (current > 0) return current === context + SBigInt(1) && current > this.min;
    if (current < 0) return current === context - SBigInt(1) && current < this.max;
    return false;
  }

  private static isValidContext(current: bigint, context?: unknown): context is bigint {
    // Context contains a value between zero and current that is known to be
    // the closer to zero passing value*.
    // *More precisely: our shrinker will not try something closer to zero
    if (context === undefined) {
      return false;
    }
    if (typeof context !== 'bigint') {
      throw new Error(`Invalid context type passed to BigIntArbitrary (#1)`);
    }
    const differentSigns = (current > 0 && context < 0) || (current < 0 && context > 0);
    if (context !== SBigInt(0) && differentSigns) {
      throw new Error(`Invalid context value passed to BigIntArbitrary (#2)`);
    }
    return true;
  }
}
