import { ArbitraryWithContextualShrink } from '../check/arbitrary/definition/ArbitraryWithContextualShrink';
import { convertFromNextWithShrunkOnce } from '../check/arbitrary/definition/Converters';
import { BigIntArbitrary } from './_internals/BigIntArbitrary';

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
export function bigUintN(n: number): ArbitraryWithContextualShrink<bigint> {
  const min = BigInt(0);
  const max = (BigInt(1) << BigInt(n)) - BigInt(1);
  const arb = new BigIntArbitrary(min, max);
  return convertFromNextWithShrunkOnce(arb, arb.defaultTarget());
}
