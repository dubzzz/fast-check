import type { Arbitrary } from '../arbitrary/definition/Arbitrary.js';
import { assertIsArbitrary } from '../arbitrary/definition/Arbitrary.js';
import { tuple } from '../../arbitrary/tuple.js';
import type { IProperty, IPropertyWithHooks, PropertyHookFunction } from './Property.generic.js';
import { Property } from './Property.generic.js';
import { AlwaysShrinkableArbitrary } from '../../arbitrary/_internals/AlwaysShrinkableArbitrary.js';
import { safeForEach, safeMap, safeSlice } from '../../utils/globals.js';

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
  // Pass `(predicate, arity)` rather than wrapping `p` in `(t) => p(...t)`.
  // Wrapping built a fresh closure per `property()` call, giving each call site
  // its own SharedFunctionInfo and feedback cell; this forced V8 to deopt the
  // hot `Property.run` chain on every fresh property and shifted the call into
  // a `CallWithSpread` slow path. Letting `Property.run` switch on a stable
  // arity-tagged dispatch keeps the call site monomorphic across calls.
  return new Property(tuple<Ts>(...mappedArbs), p as unknown as (t: Ts) => boolean | void, arbs.length);
}

export type { IProperty, IPropertyWithHooks, PropertyHookFunction };
export { property };
