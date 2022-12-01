import { jest } from '@jest/globals';
import * as fc from 'fast-check';

import type { Prop, PromiseProp, It, ArbitraryTuple } from './types.js';

function wrapProp<Ts extends [any] | any[]>(prop: Prop<Ts>): PromiseProp<Ts> {
  return (...args: Ts) => Promise.resolve(prop(...args));
}

export function buildTestWithPropRunner<Ts extends [any] | any[], TsParameters extends Ts = Ts>(
  testFn: It | It['only' | 'skip' | 'failing' | 'concurrent'] | It['concurrent']['only' | 'skip' | 'failing'],
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Ts>,
  params: fc.Parameters<TsParameters> | undefined,
  timeout: number | undefined
): void {
  const customParams: fc.Parameters<TsParameters> = { ...params };
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
