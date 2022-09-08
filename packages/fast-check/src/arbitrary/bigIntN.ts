import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { BigIntArbitrary } from './_internals/BigIntArbitrary';

const SBigInt = BigInt;

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
export function bigIntN(n: number): Arbitrary<bigint> {
  if (n < 1) {
    throw new Error('fc.bigIntN expects requested number of bits to be superior or equal to 1');
  }
  const min = SBigInt(-1) << SBigInt(n - 1);
  const max = (SBigInt(1) << SBigInt(n - 1)) - SBigInt(1);
  return new BigIntArbitrary(min, max);
}
