import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../../../check/arbitrary/definition/Converters';
import { unboxedToBoxedMapper, unboxedToBoxedUnmapper } from '../mappers/UnboxedToBoxed';

/** @internal */
export function boxedArbitraryBuilder(arb: Arbitrary<unknown>): Arbitrary<unknown> {
  return convertFromNext(convertToNext(arb).map(unboxedToBoxedMapper, unboxedToBoxedUnmapper));
}
