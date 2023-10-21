import { getCurrentSuite, setFn, createChainable } from 'vitest/suite';
import { assert, asyncProperty, readConfigureGlobal } from 'fast-check';

import type { Parameters as FcParameters } from 'fast-check';
import type { Prop, PromiseProp, ArbitraryTuple } from './types.js';

function wrapProp<Ts extends [any] | any[]>(prop: Prop<Ts>): PromiseProp<Ts> {
  return (...args: Ts) => Promise.resolve(prop(...args));
}

export const fuzz = createChainable(['skip', 'only', 'todo', 'concurrent', 'fails'], function fuzz<
  Ts extends [any] | any[],
  TsParameters extends Ts = Ts,
>(this: any, name: string, arbitraries: ArbitraryTuple<Ts>, prop: Prop<Ts>, params?: FcParameters<TsParameters>): void {
  const currentSuite = getCurrentSuite();
  const customParams: FcParameters<TsParameters> = { ...params };

  // Handle seed
  if (customParams.seed === undefined) {
    const seedFromGlobals = readConfigureGlobal().seed;
    if (seedFromGlobals !== undefined) {
      customParams.seed = seedFromGlobals;
    } else {
      customParams.seed = Date.now() ^ (Math.random() * 0x100000000);
    }
  }
  // Handle timeout
  if (customParams.interruptAfterTimeLimit === undefined) {
    // Copy global configuration of interruptAfterTimeLimit as local one
    customParams.interruptAfterTimeLimit = readConfigureGlobal().interruptAfterTimeLimit;
  }
  const vitestTimeout = currentSuite.options?.timeout;
  if (vitestTimeout !== undefined) {
    if (customParams.interruptAfterTimeLimit === undefined) {
      // Use the timeout specified at vitest's level for interruptAfterTimeLimit
      customParams.interruptAfterTimeLimit = vitestTimeout;
    } else {
      // Mix both vitest and fc's timeouts
      customParams.interruptAfterTimeLimit = Math.min(customParams.interruptAfterTimeLimit, vitestTimeout);
    }
  }

  // Run with Vitest
  const task = currentSuite.task(name, { ...this, meta: { fuzz: true } });
  setFn(task, async () => {
    const promiseProp = wrapProp(prop);
    const propertyInstance = (asyncProperty as any)(...(arbitraries as any), promiseProp);
    await assert(propertyInstance, customParams);
  });
});
