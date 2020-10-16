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
    return new Shrinkable(value, () => this.shrink(value, shrunkOnce).map((v) => this.wrapper(v, true)));
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
 * @param n - Maximal number of bits of the generated bigint
 *
 * @public
 */
function bigIntN(n: number): ArbitraryWithShrink<bigint> {
  return new BigIntArbitrary(BigInt(-1) << BigInt(n - 1), (BigInt(1) << BigInt(n - 1)) - BigInt(1));
}

/**
 * For unsigned bigint of n bits
 *
 * Generated values will be between 0 (included) and 2^n (excluded)
 *
 * @param n - Maximal number of bits of the generated bigint
 *
 * @public
 */
function bigUintN(n: number): ArbitraryWithShrink<bigint> {
  return new BigIntArbitrary(BigInt(0), (BigInt(1) << BigInt(n)) - BigInt(1));
}

/**
 * Constraints to be applied on {@link bigInt}
 * @public
 */
export interface BigIntConstraints {
  /** Lower bound for the generated bigints (eg.: -5n, 0n, BigInt(Number.MIN_SAFE_INTEGER)) */
  min?: bigint;
  /** Upper bound for the generated bigints (eg.: -2n, 2147483647n, BigInt(Number.MAX_SAFE_INTEGER)) */
  max?: bigint;
}

/**
 * Build fully set BigIntConstraints from a partial data
 * @internal
 */
function buildCompleteBigIntConstraints(constraints: BigIntConstraints): Required<BigIntConstraints> {
  const DefaultPow = 256;
  const DefaultMin = BigInt(-1) << BigInt(DefaultPow - 1);
  const DefaultMax = (BigInt(1) << BigInt(DefaultPow - 1)) - BigInt(1);

  const min = constraints.min;
  const max = constraints.max;
  return {
    min: min !== undefined ? min : DefaultMin - (max !== undefined && max < BigInt(0) ? max * max : BigInt(0)),
    max: max !== undefined ? max : DefaultMax + (min !== undefined && min > BigInt(0) ? min * min : BigInt(0)),
  };
}

/**
 * Extract constraints from args received by bigint
 * @internal
 */
function extractBigIntConstraints(args: [] | [bigint, bigint] | [BigIntConstraints]): BigIntConstraints {
  if (args[0] === undefined) {
    // bigInt()
    return {};
  } // args.length > 0

  if (args[1] === undefined) {
    // bigInt(constraints)
    const constraints = args[0] as BigIntConstraints;
    return constraints;
  } // args.length > 1

  return { min: args[0] as bigint, max: args[1] as bigint }; // bigInt(min, max)
}

/**
 * For bigint
 * @public
 */
function bigInt(): ArbitraryWithShrink<bigint>;
/**
 * For bigint between min (included) and max (included)
 *
 * @param min - Lower bound for the generated bigints (eg.: -5n, 0n, BigInt(Number.MIN_SAFE_INTEGER))
 * @param max - Upper bound for the generated bigints (eg.: -2n, 2147483647n, BigInt(Number.MAX_SAFE_INTEGER))
 *
 * @public
 */
function bigInt(min: bigint, max: bigint): ArbitraryWithShrink<bigint>;
/**
 * For bigint between min (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
function bigInt(constraints: BigIntConstraints): ArbitraryWithShrink<bigint>;
function bigInt(...args: [] | [bigint, bigint] | [BigIntConstraints]): ArbitraryWithShrink<bigint> {
  const constraints = buildCompleteBigIntConstraints(extractBigIntConstraints(args));
  return new BigIntArbitrary(constraints.min, constraints.max);
}

/**
 * Constraints to be applied on {@link bigUint}
 * @public
 */
export interface BigUintConstraints {
  /** Upper bound for the generated bigints (eg.: 2147483647n, BigInt(Number.MAX_SAFE_INTEGER)) */
  max?: bigint;
}

/**
 * For positive bigint
 * @public
 */
function bigUint(): ArbitraryWithShrink<bigint>;
/**
 * For positive bigint between 0 (included) and max (included)
 *
 * @param max - Upper bound for the generated bigint
 *
 * @public
 */
function bigUint(max: bigint): ArbitraryWithShrink<bigint>;
/**
 * For positive bigint between 0 (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
function bigUint(constraints: BigUintConstraints): ArbitraryWithShrink<bigint>;
function bigUint(constraints?: bigint | BigUintConstraints): ArbitraryWithShrink<bigint> {
  const max = constraints === undefined ? undefined : typeof constraints === 'object' ? constraints.max : constraints;
  return max === undefined ? bigUintN(256) : new BigIntArbitrary(BigInt(0), max);
}

export { bigIntN, bigUintN, bigInt, bigUint };
