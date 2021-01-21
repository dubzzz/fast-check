import { Random } from '../../../random/generator/Random';
import { stream, Stream } from '../../../stream/Stream';
import { Arbitrary } from '../definition/Arbitrary';
import { ArbitraryWithContextualShrink } from '../definition/ArbitraryWithContextualShrink';
import { biasWrapper } from '../definition/BiasedArbitraryWrapper';
import { Shrinkable } from '../definition/Shrinkable';
import {
  add64,
  ArrayInt64,
  halve64,
  isEqual64,
  isStrictlyNegative64,
  isStrictlyPositive64,
  isZero64,
  logLike64,
  substract64,
  Unit64,
  Zero64,
} from './ArrayInt64';
import { BiasedNumericArbitrary } from './BiasNumeric';

/** @internal */
class ArrayInt64Arbitrary extends ArbitraryWithContextualShrink<ArrayInt64> {
  private biasedArrayInt64Arbitrary: Arbitrary<ArrayInt64> | null = null;
  constructor(
    readonly min: ArrayInt64,
    readonly max: ArrayInt64,
    readonly genMin: ArrayInt64,
    readonly genMax: ArrayInt64
  ) {
    super();
  }
  private wrapper(value: ArrayInt64, context: unknown): Shrinkable<ArrayInt64> {
    return new Shrinkable(value, () =>
      this.contextualShrink(value, context).map(([v, nextContext]) => this.wrapper(v, nextContext))
    );
  }
  generate(mrng: Random): Shrinkable<ArrayInt64> {
    const uncheckedValue = mrng.nextArrayInt(this.genMin, this.genMax);
    if (uncheckedValue.data.length === 1) {
      // either 1 or 2, never 0 or >2
      uncheckedValue.data.unshift(0); // prepend a zero
    }
    return this.wrapper(uncheckedValue as ArrayInt64, undefined);
  }
  private shrinkValueTowards(
    value: ArrayInt64,
    target: ArrayInt64,
    tryTargetAsap?: boolean
  ): Stream<[ArrayInt64, unknown]> {
    const realGap = substract64(value, target);
    function* shrinkGen(): IterableIterator<[ArrayInt64, unknown]> {
      let previous: ArrayInt64 | undefined = tryTargetAsap ? undefined : target;
      const gap = tryTargetAsap ? realGap : halve64(realGap);
      for (let toremove = gap; !isZero64(toremove); toremove = halve64(toremove)) {
        const next = substract64(value, toremove);
        yield [next, previous]; // previous indicates the last passing value
        previous = next;
      }
    }
    return stream(shrinkGen());
  }
  contextualShrink(current: ArrayInt64, context?: unknown): Stream<[ArrayInt64, unknown]> {
    if (!ArrayInt64Arbitrary.isValidContext(current, context)) {
      const target = this.defaultTarget();
      return this.shrinkValueTowards(current, target, true);
    }
    // Last chance try...
    const currentIsZero = isZero64(current);
    const currentIsStPos = !currentIsZero && current.sign === 1;
    if (
      currentIsStPos &&
      isEqual64(current, add64(context, Unit64)) &&
      isStrictlyPositive64(substract64(current, this.min))
    ) {
      return Stream.of([context, undefined]); // undefined reset context in case of failure
    }
    const currentIsStNeg = !currentIsZero && current.sign === -1;
    if (
      currentIsStNeg &&
      isEqual64(current, substract64(context, Unit64)) &&
      isStrictlyNegative64(substract64(current, this.max))
    ) {
      return Stream.of([context, undefined]); // undefined reset context in case of failure
    }
    // Normal shrink process
    return this.shrinkValueTowards(current, context, false);
  }
  shrunkOnceContext(): unknown {
    return this.defaultTarget();
  }
  private defaultTarget(): ArrayInt64 {
    // min <= 0 && max >= 0   => shrink towards zero
    if (!isStrictlyPositive64(this.min) && !isStrictlyNegative64(this.max)) {
      return Zero64;
    }
    // current < 0            => shrink towards max (closer to zero)
    // otherwise              => shrink towards min (closer to zero)
    return isStrictlyNegative64(this.min) ? this.max : this.min;
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
  private pureBiasedArbitrary(): Arbitrary<ArrayInt64> {
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
  withBias(freq: number): Arbitrary<ArrayInt64> {
    return biasWrapper(freq, this, (originalArbitrary: ArrayInt64Arbitrary) => originalArbitrary.pureBiasedArbitrary());
  }
}

/** @internal */
export function arrayInt64(min: ArrayInt64, max: ArrayInt64): Arbitrary<ArrayInt64> {
  return new ArrayInt64Arbitrary(min, max, min, max);
}
