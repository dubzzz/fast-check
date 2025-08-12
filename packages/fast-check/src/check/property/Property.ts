import type { Arbitrary } from '../arbitrary/definition/Arbitrary';
import { assertIsArbitrary } from '../arbitrary/definition/Arbitrary';
import { tuple } from '../../arbitrary/tuple';
import type { IProperty, IPropertyWithHooks, PropertyHookFunction } from './Property.generic';
import { Property } from './Property.generic';
import { AlwaysShrinkableArbitrary } from '../../arbitrary/_internals/AlwaysShrinkableArbitrary';
import { safeForEach, safeMap, safeSlice } from '../../utils/globals';

/**
 * Instantiate a new {@link fast-check#IProperty}
 * @param predicate - Assess the success of the property. Would be considered falsy if it throws or if its output evaluates to false
 * @remarks Since 0.0.1
 * @public
 */
function property<Ts extends [unknown, ...unknown[]]>(
  ...args: [...arbitraries: { [K in keyof Ts]: Arbitrary<Ts[K]> }, predicate: (...args: Ts) => boolean | void]
): IPropertyWithHooks<Ts> {
  if (args.length < 2) {
    throw new Error('property expects at least two parameters');
  }
  const arbs = safeSlice(args, 0, args.length - 1) as { [K in keyof Ts]: Arbitrary<Ts[K]> };
  const p = args[args.length - 1] as (...args: Ts) => boolean | void;
  safeForEach(arbs, assertIsArbitrary);
  const mappedArbs = safeMap(arbs, (arb): Arbitrary<unknown> => new AlwaysShrinkableArbitrary(arb)) as typeof arbs;
  return new Property(tuple<Ts>(...mappedArbs), (t) => p(...t));
}

export type { IProperty, IPropertyWithHooks, PropertyHookFunction };
export { property };
