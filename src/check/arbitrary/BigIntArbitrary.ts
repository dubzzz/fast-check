import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithContextualShrink } from './definition/ArbitraryWithContextualShrink';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';
import { Shrinkable } from './definition/Shrinkable';
import { biasNumeric, bigIntLogLike } from './helpers/BiasNumeric';
import { shrinkBigInt } from './helpers/ShrinkBigInt';

/** @internal */
class BigIntArbitrary extends ArbitraryWithContextualShrink<bigint> {
  private biasedBigIntArbitrary: Arbitrary<bigint> | null = null;

  constructor(readonly min: bigint, readonly max: bigint, readonly genMin: bigint, readonly genMax: bigint) {
    super();
  }

  private wrapper(value: bigint, context: unknown): Shrinkable<bigint> {
    return new Shrinkable(value, () =>
      this.contextualShrink(value, context).map(([v, nextContext]) => this.wrapper(v, nextContext))
    );
  }

  generate(mrng: Random): Shrinkable<bigint> {
    return this.wrapper(mrng.nextBigInt(this.genMin, this.genMax), undefined);
  }

  contextualShrink(current: bigint, context?: unknown): Stream<[bigint, unknown]> {
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
      return Stream.of([context, undefined]);
    }
    // Normal shrink process
    return shrinkBigInt(current, context, false);
  }

  shrunkOnceContext(): unknown {
    return this.defaultTarget();
  }

  private defaultTarget(): bigint {
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

  private pureBiasedArbitrary(): Arbitrary<bigint> {
    if (this.biasedBigIntArbitrary != null) {
      return this.biasedBigIntArbitrary;
    }
    this.biasedBigIntArbitrary = biasNumeric(this.min, this.max, BigIntArbitrary, bigIntLogLike);
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
 * @remarks Since 1.9.0
 * @public
 */
function bigIntN(n: number): ArbitraryWithContextualShrink<bigint> {
  const min = BigInt(-1) << BigInt(n - 1);
  const max = (BigInt(1) << BigInt(n - 1)) - BigInt(1);
  return new BigIntArbitrary(min, max, min, max);
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
  return new BigIntArbitrary(min, max, min, max);
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
 * @public
 */
function bigInt(constraints: BigIntConstraints): ArbitraryWithContextualShrink<bigint>;
function bigInt(...args: [] | [bigint, bigint] | [BigIntConstraints]): ArbitraryWithContextualShrink<bigint> {
  const constraints = buildCompleteBigIntConstraints(extractBigIntConstraints(args));
  return new BigIntArbitrary(constraints.min, constraints.max, constraints.min, constraints.max);
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
 * @public
 */
function bigUint(constraints: BigUintConstraints): ArbitraryWithContextualShrink<bigint>;
function bigUint(constraints?: bigint | BigUintConstraints): ArbitraryWithContextualShrink<bigint> {
  const max = constraints === undefined ? undefined : typeof constraints === 'object' ? constraints.max : constraints;
  return max === undefined ? bigUintN(256) : new BigIntArbitrary(BigInt(0), max, BigInt(0), max);
}

export { bigIntN, bigUintN, bigInt, bigUint };
