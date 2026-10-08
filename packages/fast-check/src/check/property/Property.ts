import type { Arbitrary } from '../arbitrary/definition/Arbitrary.js';
import { tuple } from '../../arbitrary/tuple.js';
import type { Property } from './types/Property.js';
import { PropertyImplem } from './_internals/PropertyImplem.js';
import { AlwaysShrinkableArbitrary } from '../../arbitrary/_internals/AlwaysShrinkableArbitrary.js';
import type { PredicateExecutionContext } from './types/PredicateExecutionContext.js';

/**
 * Instantiate a new {@link fast-check#Property} with a synchronous or asynchronous predicate
 *
 * The predicate receives the generated values in order, followed by a {@link PredicateExecutionContext}.
 * Declare a parameter after all generated values to access context supplied by plugins.
 *
 * @param predicate - Assess the success of the property. Would be considered falsy if it throws or if its output evaluates to false
 * @remarks Since 0.0.1 (asynchronous predicates supported since 5.0.0, previously via `asyncProperty` since 0.0.7; execution context since 5.0.0)
 * @public
 */
function property<Ts extends [unknown, ...unknown[]]>(
  ...args: [
    ...arbitraries: { [K in keyof Ts]: Arbitrary<Ts[K]> },
    predicate: (...args: Ts) => Promise<boolean | void> | boolean | void,
  ]
): Property<Ts>;
/**
 * Instantiate a new {@link fast-check#Property} with a synchronous or asynchronous predicate
 * @param predicate - Assess the success of the property. Would be considered falsy if it throws or if its output evaluates to false
 * @remarks Since 5.0.0
 * @public
 */
function property<Ts extends [unknown, ...unknown[]]>(
  ...args: [
    ...arbitraries: { [K in keyof Ts]: Arbitrary<Ts[K]> },
    predicate: (...args: [...Ts, PredicateExecutionContext]) => Promise<boolean | void> | boolean | void,
  ]
): Property<Ts>;
function property<Ts extends [unknown, ...unknown[]]>(
  ...args: [
    ...arbitraries: { [K in keyof Ts]: Arbitrary<Ts[K]> },
    predicate:
      | ((...args: Ts) => Promise<boolean | void> | boolean | void)
      | ((...args: [...Ts, PredicateExecutionContext]) => Promise<boolean | void> | boolean | void),
  ]
): Property<Ts> {
  const arbs = args.slice(0, args.length - 1) as { [K in keyof Ts]: Arbitrary<Ts[K]> };
  const p = args[args.length - 1] as (...args: Ts | [...Ts, PredicateExecutionContext]) => Promise<boolean | void>;
  const mappedArbs = arbs.map((arb): Arbitrary<unknown> => new AlwaysShrinkableArbitrary(arb)) as typeof arbs;
  return new PropertyImplem(tuple<Ts>(...mappedArbs), (t, executionContext) => p(...t, executionContext));
}

export { property };
