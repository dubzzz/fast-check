import { readConfigureGlobal } from 'fast-check';
import { getCurrentTest, getHooks } from 'vitest/suite';

import type { Parameters as FcParameters } from 'fast-check';
import type { Prop, PromiseProp, It, ArbitraryTuple, FcExtra } from './types.js';
import type { RunnerTestSuite } from 'vitest';

function wrapProp<Ts extends [any] | any[]>(prop: Prop<Ts>): PromiseProp<Ts> {
  return (...args: Ts) => Promise.resolve(prop(...args));
}

/**
 * Collect the suite chain from the given suite up to the file-level suite.
 * Returns the chain with the innermost suite first.
 */
function getSuiteChain(suite: RunnerTestSuite): RunnerTestSuite[] {
  const chain: RunnerTestSuite[] = [];
  let current = suite;
  while (current) {
    chain.push(current);
    if ('filepath' in current) break;
    current = current.suite || current.file;
  }
  return chain;
}

/**
 * Collect beforeEach hooks in top-down order (parent suites first),
 * matching vitest's callSuiteHook behavior for "beforeEach".
 */
function collectBeforeEachHooks(suite: RunnerTestSuite): ReturnType<typeof getHooks>['beforeEach'] {
  const chain = getSuiteChain(suite);
  const hooks: ReturnType<typeof getHooks>['beforeEach'] = [];
  for (let i = chain.length - 1; i >= 0; i--) {
    const h = getHooks(chain[i]);
    if (h?.beforeEach) hooks.push(...h.beforeEach);
  }
  return hooks;
}

/**
 * Collect afterEach hooks in bottom-up order (current suite first),
 * with hooks within each suite in reverse registration order (stack behavior),
 * matching vitest's callSuiteHook behavior for "afterEach".
 */
function collectAfterEachHooks(suite: RunnerTestSuite): ReturnType<typeof getHooks>['afterEach'] {
  const chain = getSuiteChain(suite);
  const hooks: ReturnType<typeof getHooks>['afterEach'] = [];
  for (let i = 0; i < chain.length; i++) {
    const h = getHooks(chain[i]);
    if (h?.afterEach) hooks.push(...[...h.afterEach].reverse());
  }
  return hooks;
}

export function buildTestWithPropRunner<Ts extends [any] | any[], TsParameters extends Ts = Ts>(
  testFn: It | It['only' | 'skip' | 'concurrent'],
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Ts>,
  params: FcParameters<TsParameters> | undefined,
  timeout: number | undefined,
  fc: FcExtra,
): void {
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
    customParams.interruptAfterTimeLimit = fc.readConfigureGlobal().interruptAfterTimeLimit;
  }

  const promiseProp = wrapProp(prop);

  // Instantiate property outside of testFn for the needs of worker-based version
  const propertyInstance = (fc.asyncProperty as any)(...(arbitraries as any), promiseProp);
  testFn(
    `${label} (with seed=${customParams.seed})`,
    async () => {
      // Hook into fc's property lifecycle to call vitest's beforeEach/afterEach
      // between consecutive runs within the single test.
      //
      // Strategy:
      //   - vitest calls its own beforeEach before the test (covers 1st run)
      //   - fc property beforeEach between runs: vitest afterEach + vitest beforeEach
      //   - vitest calls its own afterEach after the test (covers last run)
      //
      // Result: exactly N beforeEach + N afterEach for N property runs.
      const test = getCurrentTest();
      const suite = test?.suite || test?.file;
      if (suite) {
        const beforeEachHooks = collectBeforeEachHooks(suite);
        const afterEachHooks = collectAfterEachHooks(suite);

        if (beforeEachHooks.length > 0 || afterEachHooks.length > 0) {
          let isFirstRun = true;

          propertyInstance.beforeEach(async (previousHook: () => Promise<void>) => {
            await previousHook();

            if (isFirstRun) {
              isFirstRun = false;
              return;
            }

            // Between runs: close previous iteration, then open next
            for (const hook of afterEachHooks) {
              await hook(test.context, suite);
            }

            for (const hook of beforeEachHooks) {
              await hook(test.context, suite);
            }
          });
        }
      }

      await fc.assert(propertyInstance, customParams);
    },
    timeout,
  );
}
