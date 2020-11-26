import { Random } from '../../../random/generator/Random';
import { stream, Stream } from '../../../stream/Stream';
import { Arbitrary } from '../definition/Arbitrary';
import { ArbitraryWithShrink } from '../definition/ArbitraryWithShrink';
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
  negative64,
  substract64,
  Zero64,
} from './ArrayInt64';
import { BiasedNumericArbitrary } from './BiasNumeric';

/** @internal */
class ArrayInt64Arbitrary extends ArbitraryWithShrink<ArrayInt64> {
  private biasedArrayInt64Arbitrary: Arbitrary<ArrayInt64> | null = null;
  constructor(
    readonly min: ArrayInt64,
    readonly max: ArrayInt64,
    readonly genMin: ArrayInt64,
    readonly genMax: ArrayInt64
  ) {
    super();
  }
  private wrapper(value: ArrayInt64, shrunkOnce: boolean): Shrinkable<ArrayInt64> {
    return new Shrinkable(value, () => this.shrink(value, shrunkOnce).map((v) => this.wrapper(v, true)));
  }
  generate(mrng: Random): Shrinkable<ArrayInt64> {
    const uncheckedValue = mrng.nextArrayInt(this.genMin, this.genMax);
    if (uncheckedValue.data.length === 1) {
      // either 1 or 2, never 0 or >2
      uncheckedValue.data.unshift(0); // prepend a zero
    }
    return this.wrapper(uncheckedValue as ArrayInt64, false);
  }
  private shrinkValueTowards(value: ArrayInt64, target: ArrayInt64, shrunkOnce?: boolean): Stream<ArrayInt64> {
    const realGap = substract64(value, target);
    function* shrinkGen(): IterableIterator<ArrayInt64> {
      const gap = shrunkOnce ? halve64(realGap) : realGap;
      for (let toremove = gap; !isZero64(toremove); toremove = halve64(toremove)) {
        yield substract64(value, toremove);
      }
    }
    return stream(shrinkGen());
  }
  shrink(value: ArrayInt64, shrunkOnce?: boolean): Stream<ArrayInt64> {
    // min <= 0 && max >= 0
    // => shrink towards zero
    if (!isStrictlyPositive64(this.min) && !isStrictlyNegative64(this.max)) {
      return this.shrinkValueTowards(value, Zero64, shrunkOnce);
    }
    // value < 0
    // => shrink towards max (closer to zero)
    if (isStrictlyNegative64(value)) {
      return this.shrinkValueTowards(value, this.max, shrunkOnce);
    }
    // => shrink towards min (closer to zero)
    return this.shrinkValueTowards(value, this.min, shrunkOnce);
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
      const logMin = logLike64(this.min); // min !== 0
      const logMax = logLike64(this.max); // max !== 0
      this.biasedArrayInt64Arbitrary = new BiasedNumericArbitrary(
        new ArrayInt64Arbitrary(this.min, this.max, negative64(logMin), logMax), // close to zero,
        new ArrayInt64Arbitrary(this.min, this.max, substract64(this.max, logMax), this.max), // close to max
        new ArrayInt64Arbitrary(this.min, this.max, this.min, add64(this.min, logMin)) // close to min
      );
    } else {
      // Either min < 0 && max <= 0
      // Or min >= 0, so max >= 0
      const logGap = logLike64(substract64(this.max, this.min)); // max-min !== 0
      const arbCloseToMin = new ArrayInt64Arbitrary(this.min, this.max, this.min, add64(this.min, logGap)); // close to min
      const arbCloseToMax = new ArrayInt64Arbitrary(this.min, this.max, substract64(this.max, logGap), this.max); // close to max
      return minStrictlySmallerZero
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
