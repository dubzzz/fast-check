import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { BigIntArbitrary } from './_internals/BigIntArbitrary';

const SBigInt = BigInt;

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
export function bigUintN(n: number): Arbitrary<bigint> {
  if (n < 0) {
    throw new Error('fc.bigUintN expects requested number of bits to be superior or equal to 0');
  }
  const min = SBigInt(0);
  const max = (SBigInt(1) << SBigInt(n)) - SBigInt(1);
  return new BigIntArbitrary(min, max);
}
