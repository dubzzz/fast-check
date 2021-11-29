import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { BigIntArbitrary } from './_internals/BigIntArbitrary';

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
function bigInt(): Arbitrary<bigint>;
/**
 * For bigint between min (included) and max (included)
 *
 * @param min - Lower bound for the generated bigints (eg.: -5n, 0n, BigInt(Number.MIN_SAFE_INTEGER))
 * @param max - Upper bound for the generated bigints (eg.: -2n, 2147483647n, BigInt(Number.MAX_SAFE_INTEGER))
 *
 * @remarks Since 1.9.0
 * @public
 */
function bigInt(min: bigint, max: bigint): Arbitrary<bigint>;
/**
 * For bigint between min (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.6.0
 * @public
 */
function bigInt(constraints: BigIntConstraints): Arbitrary<bigint>;
function bigInt(...args: [] | [bigint, bigint] | [BigIntConstraints]): Arbitrary<bigint> {
  const constraints = buildCompleteBigIntConstraints(extractBigIntConstraints(args));
  if (constraints.min > constraints.max) {
    throw new Error('fc.bigInt expects max to be greater than or equal to min');
  }
  const arb = new BigIntArbitrary(constraints.min, constraints.max);
  return arb;
}
export { bigInt };
