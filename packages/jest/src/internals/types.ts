import type { it as itJest } from '@jest/globals';
import type { Arbitrary, Property, property, assert, readConfigureGlobal, interruptAfterTimeLimit } from 'fast-check';

// Worker predicates only receive generated values, without an execution context.
type WorkerPropertyBuilder = <Ts extends [unknown, ...unknown[]]>(
  ...args: [...arbitraries: ArbitraryTuple<Ts>, predicate: (...args: Ts) => boolean | void | Promise<boolean | void>]
) => Property<Ts>;

export type FcExtra = {
  asyncProperty?: typeof property;
  property: typeof property | WorkerPropertyBuilder;
  assert: typeof assert;
  readConfigureGlobal: typeof readConfigureGlobal;
  interruptAfterTimeLimit: typeof interruptAfterTimeLimit;
};

export type JestExtra = {
  /**
   * This option is only available since v29.2.0 of Jest
   * See official release note: https://github.com/facebook/jest/releases/tag/v29.2.0
   */
  getSeed?: () => number;
};

export type It = typeof itJest;

// Pre-requisite: https://github.com/Microsoft/TypeScript/pull/26063
// Require TypeScript 3.1
export type ArbitraryTuple<Ts extends [any] | any[]> = {
  [P in keyof Ts]: Arbitrary<Ts[P]>;
};
export type ArbitraryRecord<Ts> = {
  [P in keyof Ts]: Arbitrary<Ts[P]>;
};

export type Prop<Ts extends [any] | any[]> = (...args: Ts) => boolean | void | PromiseLike<boolean | void>;
export type PropRecord<Ts> = (arg: Ts) => boolean | void | PromiseLike<boolean | void>;

export type PromiseProp<Ts extends [any] | any[]> = (...args: Ts) => Promise<boolean | void>;
