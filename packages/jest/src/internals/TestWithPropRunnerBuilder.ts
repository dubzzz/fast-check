import { readConfigureGlobal } from 'fast-check';

import type { Parameters as FcParameters } from 'fast-check';
import type { Prop, PromiseProp, It, ArbitraryTuple, JestExtra, FcExtra } from './types.js';

function wrapProp<Ts extends [any] | any[]>(prop: Prop<Ts>): PromiseProp<Ts> {
  return (...args: Ts) => Promise.resolve(prop(...args));
}

export function buildTestWithPropRunner<Ts extends [any] | any[], TsParameters extends Ts = Ts>(
  testFn: It | It['only' | 'skip' | 'failing' | 'concurrent'] | It['concurrent']['only' | 'skip' | 'failing'],
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Ts>,
  params: FcParameters<TsParameters> | undefined,
  timeout: number | undefined,
  jest: JestExtra,
  fc: FcExtra
): void {
  const customParams: FcParameters<TsParameters> = { ...params };
  // Handle seed
  if (customParams.seed === undefined) {
    const seedFromGlobals = readConfigureGlobal().seed;
    if (seedFromGlobals !== undefined) {
      customParams.seed = seedFromGlobals;
    } else {
      const seedFromJest = typeof jest.getSeed === 'function' ? jest.getSeed() : undefined;
      if (seedFromJest !== undefined) {
        customParams.seed = seedFromJest;
      } else {
        customParams.seed = Date.now() ^ (Math.random() * 0x100000000);
      }
    }
  }
  // Handle timeout
  if (customParams.interruptAfterTimeLimit === undefined) {
    // Copy global configuration of interruptAfterTimeLimit as local one
    customParams.interruptAfterTimeLimit = fc.readConfigureGlobal().interruptAfterTimeLimit;
  }
  const jestTimeout = timeout !== undefined ? timeout : extractJestGLobalTimeout();
  if (jestTimeout !== undefined) {
    if (customParams.interruptAfterTimeLimit === undefined) {
      // Use the timeout specified at jest's level for interruptAfterTimeLimit
      customParams.interruptAfterTimeLimit = jestTimeout;
    } else {
      // Mix both jest and fc's timeouts
      customParams.interruptAfterTimeLimit = Math.min(customParams.interruptAfterTimeLimit, jestTimeout);
    }
  }

  const promiseProp = wrapProp(prop);

  // Instantiate property outside of testFn for the needs of worker-based version
  const propertyInstance = (fc.asyncProperty as any)(...(arbitraries as any), promiseProp);
  testFn(
    `${label} (with seed=${customParams.seed})`,
    async () => {
      await fc.assert(propertyInstance, customParams);
    },
    0x7fffffff // must be 32-bit signed integer
  );
}

function extractJestGLobalTimeout(): number | undefined {
  // Initialized via setTimeout, see https://github.com/facebook/jest/blob/fb2de8a10f8e808b080af67aa771f67b5ea537ce/packages/jest-runtime/src/index.ts#L2174
  const jestTimeout = (globalThis as any)[Symbol.for('TEST_TIMEOUT_SYMBOL')];
  if (typeof jestTimeout === 'number') {
    return jestTimeout;
  }
  const stateSymbolStringValue = String(Symbol('JEST_STATE_SYMBOL'));
  for (const key of Object.getOwnPropertySymbols(globalThis)) {
    if (String(key) === stateSymbolStringValue) {
      const jestState = (globalThis as any)[key];
      if (jestState !== null && typeof jestState === 'object' && typeof jestState.testTimeout === 'number') {
        return jestState.testTimeout;
      }
    }
  }
  return 10000; // no such case expected
}
