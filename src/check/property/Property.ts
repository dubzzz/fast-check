import { Arbitrary } from '../arbitrary/definition/Arbitrary';
import { tuple } from '../arbitrary/TupleArbitrary';
import { Property, IProperty, IPropertyWithHooks, PropertyHookFunction } from './Property.generic';

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
  const arbs = args.slice(0, args.length - 1) as { [K in keyof Ts]: Arbitrary<Ts[K]> };
  const p = args[args.length - 1] as (...args: Ts) => boolean | void;
  return new Property(tuple<Ts>(...arbs), (t) => p(...t));
}

export { property, IProperty, IPropertyWithHooks, PropertyHookFunction };
