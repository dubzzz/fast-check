import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { ArbitraryWithContextualShrink } from './definition/ArbitraryWithContextualShrink';
import { convertFromNextWithShrunkOnce } from './definition/Converters';
import { NextArbitrary } from './definition/NextArbitrary';
import { NextValue } from './definition/NextValue';
import { biasNumericRange, bigIntLogLike } from '../../arbitrary/_internals/helpers/BiasNumericRange';
import { shrinkBigInt } from './helpers/ShrinkBigInt';

/** @internal */
class BigIntArbitrary extends NextArbitrary<bigint> {
  constructor(readonly min: bigint, readonly max: bigint) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<bigint> {
    const range = this.computeGenerateRange(mrng, biasFactor);
    return new NextValue(mrng.nextBigInt(range.min, range.max), undefined);
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

  canGenerate(value: unknown): value is bigint {
    return typeof value === 'bigint' && this.min <= value && value <= this.max;
  }

  shrink(current: bigint, context?: unknown): Stream<NextValue<bigint>> {
    if (current === BigInt(0)) {
      return Stream.nil();
    }
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
      return Stream.of(new NextValue(context, undefined));
    }
    // Normal shrink process
    return shrinkBigInt(current, context, false);
  }

  defaultTarget(): bigint {
    // min <= 0 && max >= 0   => shrink towards zero
    if (this.min <= 0 && this.max >= 0) {
      return BigInt(0);
    }
    // min < 0                => shrink towards max (closer to zero)
    // otherwise              => shrink towards min (closer to zero)
    return this.min < 0 ? this.max : this.min;
  }

  private isLastChanceTry(current: bigint, context: bigint): boolean {
    // Last chance corresponds to scenario where shrink should be empty
    // But we try a last thing just in case it can work
    if (current > 0) return current === context + BigInt(1) && current > this.min;
    if (current < 0) return current === context - BigInt(1) && current < this.max;
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
    if (context !== BigInt(0) && differentSigns) {
      throw new Error(`Invalid context value passed to BigIntArbitrary (#2)`);
    }
    return true;
  }
}

/** @internal */
function buildBigIntArbitrary(min: bigint, max: bigint): ArbitraryWithContextualShrink<bigint> {
  const arb = new BigIntArbitrary(min, max);
  return convertFromNextWithShrunkOnce(arb, arb.defaultTarget());
}

/**
 * For signed bigint of n bits
 *
 * Generated values will be between -2^(n-1) (included) and 2^(n-1) (excluded)
 *
 * @param n - Maximal number of bits of the generated bigint
 *
 * @remarks Since 1.9.0
 * @public
 */
function bigIntN(n: number): ArbitraryWithContextualShrink<bigint> {
  const min = BigInt(-1) << BigInt(n - 1);
  const max = (BigInt(1) << BigInt(n - 1)) - BigInt(1);
  return buildBigIntArbitrary(min, max);
}

/**
 * For unsigned bigint of n bits
 *
 * Generated values will be between 0 (included) and 2^n (excluded)
 *
 * @param n - Maximal number of bits of the generated bigint
 *
 * @remarks Since 1.9.0
 * @public
 */
function bigUintN(n: number): ArbitraryWithContextualShrink<bigint> {
  const min = BigInt(0);
  const max = (BigInt(1) << BigInt(n)) - BigInt(1);
  return buildBigIntArbitrary(min, max);
}

/**
 * Constraints to be applied on {@link bigInt}
 * @remarks Since 2.6.0
 * @public
 */
export interface BigIntConstraints {
  /**
   * Lower bound for the generated bigints (eg.: -5n, 0n, BigInt(Number.MIN_SAFE_INTEGER))
   * @remarks Since 2.6.0
   */
  min?: bigint;
  /**
   * Upper bound for the generated bigints (eg.: -2n, 2147483647n, BigInt(Number.MAX_SAFE_INTEGER))
   * @remarks Since 2.6.0
   */
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
 * @remarks Since 1.9.0
 * @public
 */
function bigInt(): ArbitraryWithContextualShrink<bigint>;
/**
 * For bigint between min (included) and max (included)
 *
 * @param min - Lower bound for the generated bigints (eg.: -5n, 0n, BigInt(Number.MIN_SAFE_INTEGER))
 * @param max - Upper bound for the generated bigints (eg.: -2n, 2147483647n, BigInt(Number.MAX_SAFE_INTEGER))
 *
 * @remarks Since 1.9.0
 * @public
 */
function bigInt(min: bigint, max: bigint): ArbitraryWithContextualShrink<bigint>;
/**
 * For bigint between min (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.6.0
 * @public
 */
function bigInt(constraints: BigIntConstraints): ArbitraryWithContextualShrink<bigint>;
function bigInt(...args: [] | [bigint, bigint] | [BigIntConstraints]): ArbitraryWithContextualShrink<bigint> {
  const constraints = buildCompleteBigIntConstraints(extractBigIntConstraints(args));
  return buildBigIntArbitrary(constraints.min, constraints.max);
}

/**
 * Constraints to be applied on {@link bigUint}
 * @remarks Since 2.6.0
 * @public
 */
export interface BigUintConstraints {
  /**
   * Upper bound for the generated bigints (eg.: 2147483647n, BigInt(Number.MAX_SAFE_INTEGER))
   * @remarks Since 2.6.0
   */
  max?: bigint;
}

/**
 * For positive bigint
 * @remarks Since 1.9.0
 * @public
 */
function bigUint(): ArbitraryWithContextualShrink<bigint>;
/**
 * For positive bigint between 0 (included) and max (included)
 *
 * @param max - Upper bound for the generated bigint
 *
 * @remarks Since 1.9.0
 * @public
 */
function bigUint(max: bigint): ArbitraryWithContextualShrink<bigint>;
/**
 * For positive bigint between 0 (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.6.0
 * @public
 */
function bigUint(constraints: BigUintConstraints): ArbitraryWithContextualShrink<bigint>;
function bigUint(constraints?: bigint | BigUintConstraints): ArbitraryWithContextualShrink<bigint> {
  const max = constraints === undefined ? undefined : typeof constraints === 'object' ? constraints.max : constraints;
  return max === undefined ? bigUintN(256) : buildBigIntArbitrary(BigInt(0), max);
}

export { bigIntN, bigUintN, bigInt, bigUint };
