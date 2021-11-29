import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { unboxedToBoxedMapper, unboxedToBoxedUnmapper } from '../mappers/UnboxedToBoxed';

/** @internal */
export function boxedArbitraryBuilder(arb: Arbitrary<unknown>): Arbitrary<unknown> {
  return arb.map(unboxedToBoxedMapper, unboxedToBoxedUnmapper);
}
