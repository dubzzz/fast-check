import * as fc from 'fast-check';
import type { LegacyPropertyWithHooks, PredicateExecutionContext, PropertyArbitraries } from './SharedTypes.js';

type AsyncPropertyBuilder = <Ts extends [unknown, ...unknown[]]>(
  ...args: [
    ...arbitraries: PropertyArbitraries<Ts>,
    predicate: NoInfer<(...args: [...Ts, PredicateExecutionContext?]) => Promise<boolean | void>>,
  ]
) => LegacyPropertyWithHooks<Ts>;

// v4 has a dedicated async factory, v5's property supports both kinds of predicates.
export const asyncPropertyV4V5: AsyncPropertyBuilder = ((fc as { asyncProperty?: AsyncPropertyBuilder }).asyncProperty ??
  fc.property) as AsyncPropertyBuilder;
