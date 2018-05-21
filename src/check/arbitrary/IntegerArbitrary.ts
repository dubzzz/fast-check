import * as prand from 'pure-rand';

import Random from '../../random/generator/Random';
import { stream, Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithShrink } from './definition/ArbitraryWithShrink';
import Shrinkable from './definition/Shrinkable';

/** @hidden */
class IntegerArbitrary extends ArbitraryWithShrink<number> {
  static MIN_INT: number = 0x80000000 | 0;
  static MAX_INT: number = 0x7fffffff | 0;

  readonly min: number;
  readonly max: number;
  constructor(min?: number, max?: number) {
    super();
    this.min = min === undefined ? IntegerArbitrary.MIN_INT : min;
    this.max = max === undefined ? IntegerArbitrary.MAX_INT : max;
  }
  private wrapper(value: number, shrunkOnce: boolean): Shrinkable<number> {
    return new Shrinkable(value, () => this.shrink(value, shrunkOnce).map(v => this.wrapper(v, true)));
  }
  generate(mrng: Random): Shrinkable<number> {
    return this.wrapper(mrng.nextInt(this.min, this.max), false);
  }
  private shrink_to(value: number, target: number, shrunkOnce: boolean): Stream<number> {
    const realGap = value - target;
    function* shrink_decr(): IterableIterator<number> {
      const gap = shrunkOnce ? Math.floor(realGap / 2) : realGap;
      for (let toremove = gap; toremove > 0; toremove = Math.floor(toremove / 2)) {
        yield value - toremove;
      }
    }
    function* shrink_incr(): IterableIterator<number> {
      const gap = shrunkOnce ? Math.ceil(realGap / 2) : realGap;
      for (let toremove = gap; toremove < 0; toremove = Math.ceil(toremove / 2)) {
        yield value - toremove;
      }
    }
    return realGap > 0 ? stream(shrink_decr()) : stream(shrink_incr());
  }
  shrink(value: number, shrunkOnce?: boolean): Stream<number> {
    if (this.min <= 0 && this.max >= 0) {
      return this.shrink_to(value, 0, shrunkOnce === true);
    }
    return value < 0
      ? this.shrink_to(value, this.max, shrunkOnce === true)
      : this.shrink_to(value, this.min, shrunkOnce === true);
  }
  private pureBiasedArbitrary(): Arbitrary<number> {
    const log2 = (v: number) => Math.floor(Math.log(v) / Math.log(2));
    if (this.min === this.max) {
      return new IntegerArbitrary(this.min, this.max);
    }
    if (this.min < 0) {
      return this.max > 0
        ? new IntegerArbitrary(-log2(-this.min), log2(this.max)) // min and max != 0
        : new IntegerArbitrary(this.max - log2(this.max - this.min), this.max); // max-min != 0
    }
    // min >= 0, so max >= 0
    return new IntegerArbitrary(this.min, this.min + log2(this.max - this.min)); // max-min != 0
  }
  withBias(freq: number) {
    const arb = this;
    const smallArb = this.pureBiasedArbitrary();
    return new class extends Arbitrary<number> {
      generate(mrng: Random) {
        return mrng.nextInt(1, freq) === 1 ? smallArb.generate(mrng) : arb.generate(mrng);
      }
    }();
  }
}

/**
 * For integers between -2147483648 (included) and 2147483647 (included)
 */
function integer(): ArbitraryWithShrink<number>;
/**
 * For integers between -2147483648 (included) and max (included)
 * @param max Upper bound for the generated integers (eg.: 2147483647, Number.MAX_SAFE_INTEGER)
 */
function integer(max: number): ArbitraryWithShrink<number>;
/**
 * For integers between min (included) and max (included)
 *
 * @param min Lower bound for the generated integers (eg.: 0, Number.MIN_SAFE_INTEGER)
 * @param max Upper bound for the generated integers (eg.: 2147483647, Number.MAX_SAFE_INTEGER)
 */
function integer(min: number, max: number): ArbitraryWithShrink<number>;
function integer(a?: number, b?: number): ArbitraryWithShrink<number> {
  return b === undefined ? new IntegerArbitrary(undefined, a) : new IntegerArbitrary(a, b);
}

/**
 * For positive integers between 0 (included) and 2147483647 (included)
 */
function nat(): ArbitraryWithShrink<number>;
/**
 * For positive integers between 0 (included) and max (included)
 * @param max Upper bound for the generated integers
 */
function nat(max: number): ArbitraryWithShrink<number>;
function nat(a?: number): ArbitraryWithShrink<number> {
  return new IntegerArbitrary(0, a);
}

export { integer, nat };
