import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { TupleArbitrary } from './_internals/TupleArbitrary.js';

const safeArrayIsArray = Array.isArray;

/** @internal */
type ArbsArray<Ts extends unknown[]> = { [K in keyof Ts]: Arbitrary<Ts[K]> };

/**
 * For tuples produced using the provided `arbs`
 *
 * @param arbs - Ordered list of arbitraries
 *
 * @remarks Since 0.0.1
 * @public
 */
export function tuple<Ts extends unknown[]>(...arbs: ArbsArray<Ts>): Arbitrary<Ts>;
/**
 * For tuples produced using the provided `arbs`
 *
 * @param arbs - Ordered list of arbitraries
 *
 * @remarks Since 4.9.0
 * @public
 */
export function tuple<Ts extends unknown[]>(arbs: ArbsArray<Ts>): Arbitrary<Ts>;
export function tuple<Ts extends unknown[]>(...args: ArbsArray<Ts> | [ArbsArray<Ts>]): Arbitrary<Ts> {
  // When called as `tuple([a, b, c])` the only argument is the array of arbitraries itself.
  // When called as `tuple(a, b, c)` the array of arbitraries is the rest argument.
  // Arbitraries are never arrays, so checking the first argument is enough to disambiguate.
  const arbs: ArbsArray<Ts> =
    args.length === 1 && safeArrayIsArray(args[0]) ? (args[0] as ArbsArray<Ts>) : (args as ArbsArray<Ts>);
  return new TupleArbitrary<Ts>(arbs);
}
