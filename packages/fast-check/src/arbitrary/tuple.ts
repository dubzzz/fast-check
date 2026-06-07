import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { TupleArbitrary } from './_internals/TupleArbitrary.js';

const safeArrayIsArray = Array.isArray;

/**
 * For tuples produced using the provided `arbs`
 *
 * @param arbs - Ordered list of arbitraries
 *
 * @remarks Since 0.0.1
 * @public
 */
export function tuple<Ts extends unknown[]>(...arbs: { [K in keyof Ts]: Arbitrary<Ts[K]> }): Arbitrary<Ts>;
/**
 * For tuples produced using the provided `arbs`
 *
 * @param arbs - Ordered list of arbitraries
 *
 * @remarks Since 4.9.0
 * @public
 */
export function tuple<Ts extends unknown[]>(arbs: { [K in keyof Ts]: Arbitrary<Ts[K]> }): Arbitrary<Ts>;
export function tuple<Ts extends unknown[]>(
  ...args: { [K in keyof Ts]: Arbitrary<Ts[K]> } | [{ [K in keyof Ts]: Arbitrary<Ts[K]> }]
): Arbitrary<Ts> {
  // When called as `tuple([a, b, c])` the only argument is the array of arbitraries itself.
  // When called as `tuple(a, b, c)` the array of arbitraries is the rest argument.
  // Arbitraries are never arrays, so checking the first argument is enough to disambiguate.
  const arbs = (args.length === 1 && safeArrayIsArray(args[0]) ? args[0] : args) as {
    [K in keyof Ts]: Arbitrary<Ts[K]>;
  };
  return new TupleArbitrary<Ts>(arbs);
}
