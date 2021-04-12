import { ArbitraryWithContextualShrink } from '../check/arbitrary/definition/ArbitraryWithContextualShrink';
import { convertFromNextWithShrunkOnce } from '../check/arbitrary/definition/Converters';
import { BigIntArbitrary } from './_internals/BigIntArbitrary';

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

/** @internal */
function computeDefaultMax(): bigint {
  return (BigInt(1) << BigInt(256)) - BigInt(1);
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
  const requestedMax = typeof constraints === 'object' ? constraints.max : constraints;
  const max = requestedMax !== undefined ? requestedMax : computeDefaultMax();
  if (max) {
    throw new Error('fc.bigUint expects max to be greater than or equal to zero');
  }
  const arb = new BigIntArbitrary(BigInt(0), max);
  return convertFromNextWithShrunkOnce(arb, arb.defaultTarget());
}
export { bigUint };
