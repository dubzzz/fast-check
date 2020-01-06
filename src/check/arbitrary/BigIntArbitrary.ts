import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithShrink } from './definition/ArbitraryWithShrink';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';
import { Shrinkable } from './definition/Shrinkable';
import { biasNumeric } from './helpers/BiasNumeric';
import { shrinkBigInt } from './helpers/ShrinkNumeric';

/** @internal */
class BigIntArbitrary extends ArbitraryWithShrink<bigint> {
  private biasedBigIntArbitrary: Arbitrary<bigint> | null = null;
  constructor(readonly min: bigint, readonly max: bigint) {
    super();
  }
  private wrapper(value: bigint, shrunkOnce: boolean): Shrinkable<bigint> {
    return new Shrinkable(value, () => this.shrink(value, shrunkOnce).map(v => this.wrapper(v, true)));
  }
  generate(mrng: Random): Shrinkable<bigint> {
    return this.wrapper(mrng.nextBigInt(this.min, this.max), false);
  }
  shrink(value: bigint, shrunkOnce?: boolean): Stream<bigint> {
    return shrinkBigInt(this.min, this.max, value, shrunkOnce === true);
  }
  private pureBiasedArbitrary(): Arbitrary<bigint> {
    if (this.biasedBigIntArbitrary != null) {
      return this.biasedBigIntArbitrary;
    }
    const logLike = (v: bigint) => {
      if (v === BigInt(0)) return BigInt(0);
      return BigInt(v.toString().length);
    };
    this.biasedBigIntArbitrary = biasNumeric(this.min, this.max, BigIntArbitrary, logLike);
    return this.biasedBigIntArbitrary;
  }
  withBias(freq: number): Arbitrary<bigint> {
    return biasWrapper(freq, this, (originalArbitrary: BigIntArbitrary) => originalArbitrary.pureBiasedArbitrary());
  }
}

/**
 * For signed bigint of n bits
 *
 * Generated values will be between -2^(n-1) (included) and 2^(n-1) (excluded)
 *
 * @param n Maximal number of bits of the generated bigint
 */
function bigIntN(n: number): ArbitraryWithShrink<bigint> {
  return new BigIntArbitrary(BigInt(-1) << BigInt(n - 1), (BigInt(1) << BigInt(n - 1)) - BigInt(1));
}

/**
 * For unsigned bigint of n bits
 *
 * Generated values will be between 0 (included) and 2^n (excluded)
 *
 * @param n Maximal number of bits of the generated bigint
 */
function bigUintN(n: number): ArbitraryWithShrink<bigint> {
  return new BigIntArbitrary(BigInt(0), (BigInt(1) << BigInt(n)) - BigInt(1));
}

/**
 * For bigint
 */
function bigInt(): ArbitraryWithShrink<bigint>;
/**
 * For bigint between min (included) and max (included)
 *
 * @param min Lower bound for the generated integers (eg.: 0n, BigInt(Number.MIN_SAFE_INTEGER))
 * @param max Upper bound for the generated integers (eg.: 2147483647n, BigInt(Number.MAX_SAFE_INTEGER))
 */
function bigInt(min: bigint, max: bigint): ArbitraryWithShrink<bigint>;
function bigInt(min?: bigint, max?: bigint): ArbitraryWithShrink<bigint> {
  return max === undefined ? bigIntN(256) : new BigIntArbitrary(min!, max);
}

/**
 * For positive bigint
 */
function bigUint(): ArbitraryWithShrink<bigint>;
/**
 * For positive bigint between 0 (included) and max (included)
 * @param max Upper bound for the generated bigint
 */
function bigUint(max: bigint): ArbitraryWithShrink<bigint>;
function bigUint(max?: bigint): ArbitraryWithShrink<bigint> {
  return max === undefined ? bigUintN(256) : new BigIntArbitrary(BigInt(0), max);
}

export { bigIntN, bigUintN, bigInt, bigUint };
