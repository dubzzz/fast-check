import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { TupleArbitrary } from './_internals/TupleArbitrary.js';

/**
 * For tuples produced using the provided `arbs`
 *
 * @param arbs - Ordered list of arbitraries
 *
 * @remarks Since 0.0.1
 * @public
 */
export function tuple<Ts extends unknown[]>(...arbs: { [K in keyof Ts]: Arbitrary<Ts[K]> }): Arbitrary<Ts> {
  return new TupleArbitrary<Ts>(arbs);
}
