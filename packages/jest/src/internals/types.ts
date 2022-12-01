import type { it as itJest } from '@jest/globals';
import type * as fc from 'fast-check';

export type It = typeof itJest;

// Pre-requisite: https://github.com/Microsoft/TypeScript/pull/26063
// Require TypeScript 3.1
export type ArbitraryTuple<Ts extends [any] | any[]> = {
  [P in keyof Ts]: fc.Arbitrary<Ts[P]>;
};
export type ArbitraryRecord<Ts> = {
  [P in keyof Ts]: fc.Arbitrary<Ts[P]>;
};

export type Prop<Ts extends [any] | any[]> = (...args: Ts) => boolean | void | PromiseLike<boolean | void>;
export type PropRecord<Ts> = (arg: Ts) => boolean | void | PromiseLike<boolean | void>;

export type PromiseProp<Ts extends [any] | any[]> = (...args: Ts) => Promise<boolean | void>;
