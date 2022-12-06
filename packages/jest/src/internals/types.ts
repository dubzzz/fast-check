import type { it as itJest } from '@jest/globals';
import type { Arbitrary, asyncProperty, assert } from 'fast-check';

export type FcExtra = {
  asyncProperty: typeof asyncProperty;
  assert: typeof assert;
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
