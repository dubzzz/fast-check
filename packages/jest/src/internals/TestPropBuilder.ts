import fc from 'fast-check';
import { jest } from '@jest/globals';
import { buildTestWithPropRunner } from './TestWithPropRunnerBuilder.js';

import type { It, ArbitraryTuple, Prop } from './types.js';

// Mimic Failing from @jest/types
function internalTestPropFailing(testFn: It['failing'] | It['concurrent']['failing']) {
  function base<Ts extends [any] | any[], TsParameters extends Ts = Ts>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<TsParameters>
  ): void {
    buildTestWithPropRunner(testFn, label, arbitraries, prop, params, undefined, jest, fc);
  }
  const extras = {
    // TODO - each
  };
  return Object.assign(base, extras);
}

// Mimic ItBase from @jest/types
function internalTestPropBase(testFn: It['only' | 'skip'] | It['concurrent']['only' | 'skip']) {
  function base<Ts extends [any] | any[], TsParameters extends Ts = Ts>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<TsParameters>
  ): void {
    buildTestWithPropRunner(testFn, label, arbitraries, prop, params, undefined, jest, fc);
  }
  const extras = {
    failing: internalTestPropFailing(testFn.failing),
  };
  return Object.assign(base, extras);
}

// Mimic ItConcurrentExtended from @jest/types
function internalTestPropConcurrent(testFn: It | It['concurrent']) {
  function base<Ts extends [any] | any[], TsParameters extends Ts = Ts>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<TsParameters>
  ): void {
    buildTestWithPropRunner(testFn, label, arbitraries, prop, params, undefined, jest, fc);
  }
  const extras = {
    only: internalTestPropBase(testFn.only),
    skip: internalTestPropBase(testFn.skip),
    failing: internalTestPropFailing(testFn.failing),
  };
  return Object.assign(base, extras);
}

// Mimic ItConcurrent from @jest/types
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function internalTestProp(testFn: It) {
  const base = internalTestPropConcurrent(testFn);
  const extras = {
    concurrent: internalTestPropConcurrent(testFn.concurrent),
    todo: testFn.todo,
  };
  return Object.assign(base, extras);
}

export const buildTestProp = internalTestProp;
