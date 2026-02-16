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

      // `test` is undefined when called outside a test callback (e.g. in a worker thread
      // where vitest's _test state is not set).
      // `suite` is undefined when the test has neither a parent suite nor a file
      // reference (top-level or detached test).
      if (test === undefined || suite === undefined) {
        return;
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

          // Vitest calls beforeEach cleanup functions before afterEach hooks, so we replicate that order here.
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

      // Run remaining cleanup functions from the last manual beforeEach call.
      // Vitest supports returning a cleanup function from beforeEach; the first
      // iteration's cleanup is handled by vitest's own afterEach lifecycle, but
      // cleanups from iterations 2..N are captured and invoked by us.
      for (let i = pendingCleanups.length - 1; i >= 0; i--) {
        await pendingCleanups[i]();
      }
    },
    timeout,
  );
}
