import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithShrink } from './definition/ArbitraryWithShrink';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';
import { Shrinkable } from './definition/Shrinkable';
import { biasNumeric } from './helpers/BiasNumeric';
import { shrinkNumber } from './helpers/ShrinkNumeric';

/** @internal */
class IntegerArbitrary extends ArbitraryWithShrink<number> {
  static MIN_INT: number = 0x80000000 | 0;
  static MAX_INT: number = 0x7fffffff | 0;

  private biasedIntegerArbitrary: Arbitrary<number> | null = null;
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
  shrink(value: number, shrunkOnce?: boolean): Stream<number> {
    return shrinkNumber(this.min, this.max, value, shrunkOnce === true);
  }
  private pureBiasedArbitrary(): Arbitrary<number> {
    if (this.biasedIntegerArbitrary != null) {
      return this.biasedIntegerArbitrary;
    }
    const log2 = (v: number) => Math.floor(Math.log(v) / Math.log(2));
    this.biasedIntegerArbitrary = biasNumeric<number>(this.min, this.max, IntegerArbitrary, log2);
    return this.biasedIntegerArbitrary;
  }
  withBias(freq: number): Arbitrary<number> {
    return biasWrapper(freq, this, (originalArbitrary: IntegerArbitrary) => originalArbitrary.pureBiasedArbitrary());
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
  if (a !== undefined && b !== undefined && a > b)
    throw new Error('fc.integer maximum value should be equal or greater than the minimum one');
  return b === undefined ? new IntegerArbitrary(undefined, a) : new IntegerArbitrary(a, b);
}

/**
 * For integers between Number.MIN_SAFE_INTEGER (included) and Number.MAX_SAFE_INTEGER (included)
 */
function maxSafeInteger(): ArbitraryWithShrink<number> {
  return integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
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
  if (a !== undefined && a < 0) throw new Error('fc.nat value should be greater than or equal to 0');
  return new IntegerArbitrary(0, a);
}

/**
 * For positive integers between 0 (included) and Number.MAX_SAFE_INTEGER (included)
 */
function maxSafeNat(): ArbitraryWithShrink<number> {
  return nat(Number.MAX_SAFE_INTEGER);
}

export { integer, nat, maxSafeInteger, maxSafeNat };
