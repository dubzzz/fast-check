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

  let current: RunnerTestSuite = suite;

  // Suite.file is required, so `current.suite ?? current.file` always yields
  // a valid Suite or File.  The loop terminates when we reach the File node
  // (which carries `filepath`).
  while (true) {
    chain.push(current);

    if ('filepath' in current) {
      break;
    }

    current = current.suite ?? current.file;
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

    if (h?.beforeEach !== undefined) {
      hooks.push(...h.beforeEach);
    }
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
    if (h?.afterEach !== undefined) {
      for (let j = h.afterEach.length - 1; j >= 0; j--) {
        hooks.push(h.afterEach[j]);
      }
    }
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

      if (test === undefined) {
        throw new Error(
          'Could not find the running test context. Make sure your property-based test is defined inside a vitest test() or it() block. Running outside a standard vitest test callback (e.g. in a worker thread) is not supported.',
        );
      }
      if (suite === undefined) {
        throw new Error(
          'Could not find a parent suite or file for the current test. Make sure your test is defined inside a describe() block or a test file, not as a standalone detached test.',
        );
      }

      const beforeEachHooks = collectBeforeEachHooks(suite);
      const afterEachHooks = collectAfterEachHooks(suite);
      const pendingCleanups: (() => unknown)[] = [];

      if (beforeEachHooks.length > 0 || afterEachHooks.length > 0) {
        let isFirstRun = true;

        propertyInstance.beforeEach(async (previousHook: () => Promise<void>) => {
          await previousHook();

          if (isFirstRun) {
            isFirstRun = false;
            return;
          }

          // Run pending beforeEach cleanup functions, then afterEach hooks.
          for (let i = pendingCleanups.length - 1; i >= 0; i--) {
            await pendingCleanups[i]();
          }
          pendingCleanups.length = 0;

          for (const hook of afterEachHooks) {
            await hook(test.context, suite);
          }

          for (const hook of beforeEachHooks) {
            const result = await hook(test.context, suite);
            if (typeof result === 'function') {
              pendingCleanups.push(result as () => unknown);
            }
          }
        });
      }

      await fc.assert(propertyInstance, customParams);

      // Cleanup from the last iteration (N). Cleanups 2..N-1 run inside
      // fc's beforeEach hook above. Cleanup#1 is held by vitest in a local
      // variable of runTest and runs after vitest's own afterEach — we cannot
      // intercept it.
      for (let i = pendingCleanups.length - 1; i >= 0; i--) {
        await pendingCleanups[i]();
      }
    },
    timeout,
  );
}
