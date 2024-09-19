import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { BigInt } from '../utils/globals';
import { BigIntArbitrary } from './_internals/BigIntArbitrary';

/**
 * For unsigned bigint of n bits
 *
 * Generated values will be between 0 (included) and 2^n (excluded)
 *
 * @param n - Maximal number of bits of the generated bigint
 *
 * @deprecated Please use ${@link bigInt} with `fc.bigInt({ min: 0n, max: 2n**n-1n })` instead
 * @remarks Since 1.9.0
 * @public
 */
export function bigUintN(n: number): Arbitrary<bigint> {
  if (n < 0) {
    throw new Error('fc.bigUintN expects requested number of bits to be superior or equal to 0');
  }
  const min = BigInt(0);
  const max = (BigInt(1) << BigInt(n)) - BigInt(1);
  return new BigIntArbitrary(min, max);
}
