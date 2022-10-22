import { it as itJest, test as testJest, jest } from '@jest/globals';
import { type Global } from '@jest/types';
import * as fc from 'fast-check';

type It = Global.ItConcurrent;

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
  params: fc.Parameters<Ts> | undefined,
  timeout: number | undefined
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
  testFn(
    `${label} (with seed=${customParams.seed})`,
    async () => {
      await fc.assert((fc.asyncProperty as any)(...(arbitraries as any), promiseProp), customParams);
    },
    timeout
  );
}

// Mimic Failing from @jest/types
function internalTestPropFailing(testFn: It['failing'] | It['concurrent']['failing']) {
  function base<Ts extends [any] | any[]>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<Ts>
  ): void {
    internalTestPropExecute(testFn, label, arbitraries, prop, params, undefined);
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
    internalTestPropExecute(testFn, label, arbitraries, prop, params, undefined);
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
    internalTestPropExecute(testFn, label, arbitraries, prop, params, undefined);
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

/**
 * Type used for any `{it,test}.*.prop`
 */
type TestProp<Ts extends [any] | any[]> = (
  arbitraries: ArbitraryTuple<Ts>,
  params?: fc.Parameters<Ts>
) => (testName: string, prop: Prop<Ts>, timeout?: number | undefined) => void;

/**
 * prop has just been declared for typing reasons, ideally TestProp should be enough
 * and should be used to replace `{ prop: typeof prop }` by `{ prop: TestProp<???> }`
 */
declare const prop: <Ts extends [any] | any[]>(
  arbitraries: ArbitraryTuple<Ts>,
  params?: fc.Parameters<Ts>
) => (testName: string, prop: Prop<Ts>, timeout?: number | undefined) => void;

/**
 * Build `{it,test}.*.prop` out of `{it,test}.*`
 * @param testFn - The source `{it,test}.*`
 */
function buildTestProp<Ts extends [any] | any[]>(
  testFn: It | It['only' | 'skip' | 'failing' | 'concurrent'] | It['concurrent']['only' | 'skip' | 'failing']
): TestProp<Ts> {
  return (arbitraries: ArbitraryTuple<Ts>, params?: fc.Parameters<Ts>) =>
    (testName: string, prop: Prop<Ts>, timeout?: number | undefined) =>
      internalTestPropExecute(testFn, testName, arbitraries, prop, params, timeout);
}

/**
 * Revamped {it,test} with added `.prop`
 */
type FastCheckItBuilder<T> = T &
  ('each' extends keyof T ? T & { prop: typeof prop } : T) & {
    [K in keyof Omit<T, 'each'>]: FastCheckItBuilder<T[K]>;
  };

/**
 * Build the enriched version of {it,test}, the one with added `.prop`
 */
function enrichWithTestProp<T extends (...args: any[]) => any>(testFn: T): FastCheckItBuilder<T> {
  let atLeastOneExtra = false;
  const extraKeys: Partial<FastCheckItBuilder<T>> = {};
  for (const key in testFn) {
    if (typeof testFn[key] === 'function') {
      atLeastOneExtra = true;
      extraKeys[key] = key !== 'each' ? enrichWithTestProp(testFn[key] as any) : testFn[key];
    }
  }
  if (!atLeastOneExtra) {
    return testFn as FastCheckItBuilder<T>;
  }
  const enrichedTestFn = (...args: Parameters<T>): ReturnType<T> => testFn(...args);
  if ('each' in testFn) {
    extraKeys['prop' as keyof typeof extraKeys] = buildTestProp(testFn as any) as any;
  }
  return Object.assign(enrichedTestFn, extraKeys) as FastCheckItBuilder<T>;
}

export const test: FastCheckItBuilder<It> = enrichWithTestProp(testJest);
export const it: FastCheckItBuilder<It> = enrichWithTestProp(itJest);
export const testProp = internalTestProp(testJest);
export const itProp = internalTestProp(itJest);
export { fc };
