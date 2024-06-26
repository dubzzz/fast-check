import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';

/**
 * Build an arbitrary without any bias.
 *
 * @param arb - The original arbitrary used for generating values. This arbitrary remains unchanged.
 *
 * @remarks Since 3.20.0
 * @public
 */
export function noBias<T>(arb: Arbitrary<T>): Arbitrary<T> {
  return arb.noBias();
}
