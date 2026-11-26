import * as fc from 'fast-check';
import type { LegacyPropertyWithHooks, PredicateExecutionContext, PropertyArbitraries } from './SharedTypes.js';

type AsyncPropertyBuilder = <Ts extends [unknown, ...unknown[]]>(
  ...args: [
    ...arbitraries: PropertyArbitraries<Ts>,
    predicate: NoInfer<(...args: [...Ts, PredicateExecutionContext?]) => Promise<boolean | void>>,
  ]
) => LegacyPropertyWithHooks<Ts>;

// v4 does not support PredicateExecutionContext (type-wise only)
export const asyncPropertyV4V5: AsyncPropertyBuilder = (fc as { asyncProperty: AsyncPropertyBuilder }).asyncProperty;
