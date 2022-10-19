import { it, test, jest } from '@jest/globals';
import * as fc from 'fast-check';

type It = typeof it;

// Pre-requisite: https://github.com/Microsoft/TypeScript/pull/26063
// Require TypeScript 3.1
type ArbitraryTuple<Ts extends [any] | any[]> = {
  [P in keyof Ts]: fc.Arbitrary<Ts[P]>;
};

type Prop<Ts extends [any] | any[]> = (...args: Ts) => boolean | void | PromiseLike<boolean | void>;
type PromiseProp<Ts extends [any] | any[]> = (...args: Ts) => Promise<boolean | void>;

function wrapProp<Ts extends [any] | any[]>(prop: Prop<Ts>): PromiseProp<Ts> {
  return (...args: Ts) => Promise.resolve(prop(...args));
}

function internalTestPropExecute<Ts extends [any] | any[]>(
  testFn: It | It['only' | 'skip' | 'failing' | 'concurrent'] | It['concurrent']['only' | 'skip' | 'failing'],
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Ts>,
  params?: fc.Parameters<Ts>
): void {
  const customParams: fc.Parameters<Ts> = { ...params };
  if (customParams.seed === undefined) {
    const seedFromGlobals = fc.readConfigureGlobal().seed;
    if (seedFromGlobals !== undefined) {
      customParams.seed = seedFromGlobals;
    } else {
      // This option is only available since v29.2.0 of Jest
      // See official release note: https://github.com/facebook/jest/releases/tag/v29.2.0
      const seedFromJest = typeof jest.getSeed === 'function' ? jest.getSeed() : undefined;
      if (seedFromJest !== undefined) {
        customParams.seed = seedFromJest;
      } else {
        customParams.seed = Date.now() ^ (Math.random() * 0x100000000);
      }
    }
  }

  const promiseProp = wrapProp(prop);
  testFn(`${label} (with seed=${customParams.seed})`, async () => {
    await fc.assert((fc.asyncProperty as any)(...(arbitraries as any), promiseProp), customParams);
  });
}

// Mimic Failing from @jest/types
function internalTestPropFailing(testFn: It['failing'] | It['concurrent']['failing']) {
  function base<Ts extends [any] | any[]>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<Ts>
  ): void {
    internalTestPropExecute(testFn, label, arbitraries, prop, params);
  }
  const extras = {
    // TODO - each
  };
  return Object.assign(base, extras);
}

// Mimic ItBase from @jest/types
function internalTestPropBase(testFn: It['only' | 'skip'] | It['concurrent']['only' | 'skip']) {
  function base<Ts extends [any] | any[]>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<Ts>
  ): void {
    internalTestPropExecute(testFn, label, arbitraries, prop, params);
  }
  const extras = {
    failing: internalTestPropFailing(testFn.failing),
  };
  return Object.assign(base, extras);
}

// Mimic ItConcurrentExtended from @jest/types
function internalTestPropConcurrent(testFn: It | It['concurrent']) {
  function base<Ts extends [any] | any[]>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<Ts>
  ): void {
    internalTestPropExecute(testFn, label, arbitraries, prop, params);
  }
  const extras = {
    only: internalTestPropBase(testFn.only),
    skip: internalTestPropBase(testFn.skip),
    failing: internalTestPropFailing(testFn.failing),
  };
  return Object.assign(base, extras);
}

// Mimic ItConcurrent from @jest/types
function internalTestProp(testFn: It) {
  const base = internalTestPropConcurrent(testFn);
  const extras = {
    concurrent: internalTestPropConcurrent(testFn.concurrent),
    todo: testFn.todo,
  };
  return Object.assign(base, extras);
}

export const testProp = internalTestProp(test);
export const itProp = internalTestProp(it);
export { fc };
