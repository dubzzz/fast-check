import { ArbitraryWithContextualShrink } from '../check/arbitrary/definition/ArbitraryWithContextualShrink';
import { convertFromNextWithShrunkOnce } from '../check/arbitrary/definition/Converters';
import { BigIntArbitrary } from './_internals/BigIntArbitrary';

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
export function bigIntN(n: number): ArbitraryWithContextualShrink<bigint> {
  const min = BigInt(-1) << BigInt(n - 1);
  const max = (BigInt(1) << BigInt(n - 1)) - BigInt(1);
  const arb = new BigIntArbitrary(min, max);
  return convertFromNextWithShrunkOnce(arb, arb.defaultTarget());
}
