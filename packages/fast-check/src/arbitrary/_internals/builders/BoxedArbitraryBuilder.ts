import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { unboxedToBoxedMapper, unboxedToBoxedUnmapper } from '../mappers/UnboxedToBoxed.js';

/** @internal */
export function boxedArbitraryBuilder(arb: Arbitrary<unknown>): Arbitrary<unknown> {
  return arb.map(unboxedToBoxedMapper, unboxedToBoxedUnmapper);
}
