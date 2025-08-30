import type { Arbitrary } from '../arbitrary/definition/Arbitrary';
import { assertIsArbitrary } from '../arbitrary/definition/Arbitrary';
import { tuple } from '../../arbitrary/tuple';
import type { IAsyncProperty, IAsyncPropertyWithHooks, AsyncPropertyHookFunction } from './AsyncProperty.generic';
import { AsyncProperty } from './AsyncProperty.generic';
import { AlwaysShrinkableArbitrary } from '../../arbitrary/_internals/AlwaysShrinkableArbitrary';
import { safeForEach, safeMap, safeSlice } from '../../utils/globals';

/**
 * Instantiate a new {@link fast-check#IAsyncProperty}
 * @param predicate - Assess the success of the property. Would be considered falsy if it throws or if its output evaluates to false
 * @remarks Since 0.0.7
 * @public
 */
function asyncProperty<Ts extends [unknown, ...unknown[]]>(
  ...args: [...arbitraries: { [K in keyof Ts]: Arbitrary<Ts[K]> }, predicate: (...args: Ts) => Promise<boolean | void>]
): IAsyncPropertyWithHooks<Ts> {
  if (args.length < 2) {
    throw new Error('asyncProperty expects at least two parameters');
  }
  const arbs = safeSlice(args, 0, args.length - 1) as { [K in keyof Ts]: Arbitrary<Ts[K]> };
  const p = args[args.length - 1] as (...args: Ts) => Promise<boolean | void>;
  safeForEach(arbs, assertIsArbitrary);
  const mappedArbs = safeMap(arbs, (arb): Arbitrary<unknown> => new AlwaysShrinkableArbitrary(arb)) as typeof arbs;
  return new AsyncProperty(tuple<Ts>(...mappedArbs), (t) => p(...t));
}

export type { IAsyncProperty, IAsyncPropertyWithHooks, AsyncPropertyHookFunction };
export { asyncProperty };
