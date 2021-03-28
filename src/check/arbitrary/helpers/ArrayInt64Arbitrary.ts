import { Random } from '../../../random/generator/Random';
import { stream, Stream } from '../../../stream/Stream';
import { ArbitraryWithContextualShrink } from '../definition/ArbitraryWithContextualShrink';
import { nextBiasWrapper } from '../definition/BiasedNextArbitraryWrapper';
import { convertFromNextWithShrunkOnce } from '../definition/Converters';
import { NextArbitrary } from '../definition/NextArbitrary';
import { NextValue } from '../definition/NextValue';
import {
  add64,
  ArrayInt64,
  halve64,
  isEqual64,
  isStrictlyNegative64,
  isStrictlyPositive64,
  isStrictlySmaller64,
  isZero64,
  logLike64,
  substract64,
  Unit64,
  Zero64,
} from './ArrayInt64';
import { BiasedNumericArbitrary } from './BiasNumeric';

/** @internal */
class ArrayInt64Arbitrary extends NextArbitrary<ArrayInt64> {
  private biasedArrayInt64Arbitrary: NextArbitrary<ArrayInt64> | null = null;

  constructor(
    readonly min: ArrayInt64,
    readonly max: ArrayInt64,
    readonly genMin: ArrayInt64,
    readonly genMax: ArrayInt64
  ) {
    super();
  }

  generate(mrng: Random): NextValue<ArrayInt64> {
    const uncheckedValue = mrng.nextArrayInt(this.genMin, this.genMax);
    if (uncheckedValue.data.length === 1) {
      // either 1 or 2, never 0 or >2
      uncheckedValue.data.unshift(0); // prepend a zero
    }
    return new NextValue(uncheckedValue as ArrayInt64, undefined);
  }

  canGenerate(value: unknown): value is ArrayInt64 {
    const unsafeValue = value as ArrayInt64;
    return (
      typeof value === 'object' &&
      value !== null &&
      (unsafeValue.sign === -1 || unsafeValue.sign === 1) &&
      Array.isArray(unsafeValue.data) &&
      unsafeValue.data.length === 2 &&
      ((isStrictlySmaller64(this.min, unsafeValue) && isStrictlySmaller64(unsafeValue, this.max)) ||
        isEqual64(this.min, unsafeValue) ||
        isEqual64(this.max, unsafeValue))
    );
  }

  private shrinkArrayInt64(
    value: ArrayInt64,
    target: ArrayInt64,
    tryTargetAsap?: boolean
  ): Stream<NextValue<ArrayInt64>> {
    const realGap = substract64(value, target);
    function* shrinkGen(): IterableIterator<NextValue<ArrayInt64>> {
      let previous: ArrayInt64 | undefined = tryTargetAsap ? undefined : target;
      const gap = tryTargetAsap ? realGap : halve64(realGap);
      for (let toremove = gap; !isZero64(toremove); toremove = halve64(toremove)) {
        const next = substract64(value, toremove);
        yield new NextValue(next, previous); // previous indicates the last passing value
        previous = next;
      }
    }
    return stream(shrinkGen());
  }

  shrink(current: ArrayInt64, context?: unknown): Stream<NextValue<ArrayInt64>> {
    if (!ArrayInt64Arbitrary.isValidContext(current, context)) {
      // No context:
      //   Take default target and shrink towards it
      //   Try the target on first try
      const target = this.defaultTarget();
      return this.shrinkArrayInt64(current, target, true);
    }
    if (this.isLastChanceTry(current, context)) {
      // Last chance try...
      // context is set to undefined, so that shrink will restart
      // without any assumptions in case our try find yet another bug
      return Stream.of(new NextValue(context, undefined));
    }
    // Normal shrink process
    return this.shrinkArrayInt64(current, context, false);
  }

  defaultTarget(): ArrayInt64 {
    // min <= 0 && max >= 0   => shrink towards zero
    if (!isStrictlyPositive64(this.min) && !isStrictlyNegative64(this.max)) {
      return Zero64;
    }
    // min < 0                => shrink towards max (closer to zero)
    // otherwise              => shrink towards min (closer to zero)
    return isStrictlyNegative64(this.min) ? this.max : this.min;
  }

  private isLastChanceTry(current: ArrayInt64, context: ArrayInt64): boolean {
    // Last chance corresponds to scenario where shrink should be empty
    // But we try a last thing just in case it can work
    if (isZero64(current)) {
      return false;
    }
    if (current.sign === 1) {
      return isEqual64(current, add64(context, Unit64)) && isStrictlyPositive64(substract64(current, this.min));
    } else {
      return isEqual64(current, substract64(context, Unit64)) && isStrictlyNegative64(substract64(current, this.max));
    }
  }

  private static isValidContext(_current: ArrayInt64, context?: unknown): context is ArrayInt64 {
    // Context contains a value between zero and current that is known to be
    // the closer to zero passing value*.
    // *More precisely: our shrinker will not try something closer to zero
    if (context === undefined) {
      return false;
    }
    if (typeof context !== 'object' || context === null || !('sign' in context) || !('data' in context)) {
      throw new Error(`Invalid context type passed to ArrayInt64Arbitrary (#1)`);
    }
    return true;
  }

  private pureBiasedArbitrary(): NextArbitrary<ArrayInt64> {
    if (this.biasedArrayInt64Arbitrary != null) {
      return this.biasedArrayInt64Arbitrary;
    }
    if (isEqual64(this.min, this.max)) {
      this.biasedArrayInt64Arbitrary = this;
      return this;
    }
    const minStrictlySmallerZero = isStrictlyNegative64(this.min);
    const maxStrictlyGreaterZero = isStrictlyPositive64(this.max);
    if (minStrictlySmallerZero && maxStrictlyGreaterZero) {
      // min < 0 && max > 0
      const logMin = logLike64(this.min); // min !== 0   ->   <=0
      const logMax = logLike64(this.max); // max !== 0   ->   >=0
      this.biasedArrayInt64Arbitrary = new BiasedNumericArbitrary(
        new ArrayInt64Arbitrary(this.min, this.max, logMin, logMax), // close to zero,
        new ArrayInt64Arbitrary(this.min, this.max, substract64(this.max, logMax), this.max), // close to max
        new ArrayInt64Arbitrary(this.min, this.max, this.min, substract64(this.min, logMin)) // close to min
      );
    } else {
      // Either min < 0 && max <= 0
      // Or min >= 0, so max >= 0
      const logGap = logLike64(substract64(this.max, this.min)); // max-min !== 0  ->  >=0
      const arbCloseToMin = new ArrayInt64Arbitrary(this.min, this.max, this.min, add64(this.min, logGap)); // close to min
      const arbCloseToMax = new ArrayInt64Arbitrary(this.min, this.max, substract64(this.max, logGap), this.max); // close to max
      this.biasedArrayInt64Arbitrary = minStrictlySmallerZero
        ? new BiasedNumericArbitrary(arbCloseToMax, arbCloseToMin) // max is closer to zero
        : new BiasedNumericArbitrary(arbCloseToMin, arbCloseToMax); // min is closer to zero
    }
    return this.biasedArrayInt64Arbitrary;
  }

  withBias(freq: number): NextArbitrary<ArrayInt64> {
    return nextBiasWrapper(freq, this, (originalArbitrary: ArrayInt64Arbitrary) =>
      originalArbitrary.pureBiasedArbitrary()
    );
  }
}

/** @internal */
export function arrayInt64(min: ArrayInt64, max: ArrayInt64): ArbitraryWithContextualShrink<ArrayInt64> {
  const arb = new ArrayInt64Arbitrary(min, max, min, max);
  return convertFromNextWithShrunkOnce(arb, arb.defaultTarget());
}
