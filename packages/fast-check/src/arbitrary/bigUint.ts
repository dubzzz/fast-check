import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { BigInt } from '../utils/globals';
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
function bigUint(): Arbitrary<bigint>;
/**
 * For positive bigint between 0 (included) and max (included)
 *
 * @param max - Upper bound for the generated bigint
 *
 * @remarks Since 1.9.0
 * @public
 */
function bigUint(max: bigint): Arbitrary<bigint>;
/**
 * For positive bigint between 0 (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.6.0
 * @public
 */
function bigUint(constraints: BigUintConstraints): Arbitrary<bigint>;
function bigUint(constraints?: bigint | BigUintConstraints): Arbitrary<bigint> {
  const requestedMax = typeof constraints === 'object' ? constraints.max : constraints;
  const max = requestedMax !== undefined ? requestedMax : computeDefaultMax();
  if (max < 0) {
    throw new Error('fc.bigUint expects max to be greater than or equal to zero');
  }
  return new BigIntArbitrary(BigInt(0), max);
}
export { bigUint };
