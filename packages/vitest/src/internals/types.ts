import type { TestAPI } from 'vitest';
import type { Arbitrary, asyncProperty, assert, readConfigureGlobal, GeneratorValue } from 'fast-check';

export type FcExtra = {
  asyncProperty: typeof asyncProperty;
  assert: typeof assert;
  readConfigureGlobal: typeof readConfigureGlobal;
};

export type ExtraContext = { g: GeneratorValue };
export type It = TestAPI<ExtraContext>;

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
