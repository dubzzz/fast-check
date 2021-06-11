import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { NextArbitrary } from '../check/arbitrary/definition/NextArbitrary';
import { TupleArbitrary } from './_internals/TupleArbitrary';

/**
 * For tuples produced using the provided `arbs`
 *
 * @param arbs - Ordered list of arbitraries
 *
 * @remarks Since 0.0.1
 * @public
 */
export function tuple<Ts extends unknown[]>(...arbs: { [K in keyof Ts]: Arbitrary<Ts[K]> }): Arbitrary<Ts> {
  const nextArbs = arbs.map((arb) => convertToNext(arb)) as { [K in keyof Ts]: NextArbitrary<Ts[K]> };
  return convertFromNext(new TupleArbitrary<Ts>(nextArbs));
}
