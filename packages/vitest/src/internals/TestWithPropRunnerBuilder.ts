import { readConfigureGlobal } from 'fast-check';
import { TestRunner } from 'vitest';

import type { Parameters as FcParameters, Plugin } from 'fast-check';
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

/** Collect beforeEach hooks in top-down order (parent suites first) as vitest does */
function collectBeforeEachHooks(suite: RunnerTestSuite): ReturnType<typeof TestRunner.getSuiteHooks>['beforeEach'] {
  const chain = getSuiteChain(suite);
  const hooks: ReturnType<typeof TestRunner.getSuiteHooks>['beforeEach'] = [];
  for (let i = chain.length - 1; i >= 0; i--) {
    const h = TestRunner.getSuiteHooks(chain[i]);
    hooks.push(...h.beforeEach);
  }
  return hooks;
}

/** Collect afterEach hooks in bottom-up order (current suite first) as vitest does */
function collectAfterEachHooks(suite: RunnerTestSuite): ReturnType<typeof TestRunner.getSuiteHooks>['afterEach'] {
  const chain = getSuiteChain(suite);
  const hooks: ReturnType<typeof TestRunner.getSuiteHooks>['afterEach'] = [];
  for (let i = 0; i < chain.length; i++) {
    const h = TestRunner.getSuiteHooks(chain[i]);
    for (let j = h.afterEach.length - 1; j >= 0; j--) {
      hooks.push(h.afterEach[j]);
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
      const test = TestRunner.getCurrentTest();
      if (test === undefined) {
        throw new Error(
          'Could not find the running test context. Make sure your property-based test is defined inside a vitest test() or it() block. Running outside a standard vitest test callback (e.g. in a worker thread) is not supported.',
        );
      }

      const suite = test.suite ?? test.file;
      if (suite === undefined) {
        throw new Error(
          'Could not find a parent suite or file for the current test. Make sure your test is defined inside a describe() block or a test file, not as a standalone detached test.',
        );
      }

      const extraLifeCyclePlugins: Plugin<unknown>[] = [];

      type LCHook<T> = T | Promise<T>;
      const beforeHooks = collectBeforeEachHooks(suite);
      for (let hookIndex = 0; hookIndex !== beforeHooks.length; ++hookIndex) {
        const hook = beforeHooks[hookIndex];
        let runCount = 0;
        extraLifeCyclePlugins.push(
          fc.beforeEach(() => {
            if (hookIndex === 0) {
              runCount += 1;
            }
            if (runCount <= 1) {
              return;
            }
            return hook(test.context, suite) as LCHook<void | (() => void)>;
          }),
        );
      }
      const afterHooks = collectAfterEachHooks(suite);
      for (let hookIndex = 0; hookIndex !== afterHooks.length; ++hookIndex) {
        const hook = afterHooks[hookIndex];
        let runCount = 0;
        extraLifeCyclePlugins.push(
          fc.afterEach(() => {
            if (hookIndex === 0) {
              runCount += 1;
            }
            if (runCount <= 1) {
              return;
            }
            return hook(test.context, suite) as LCHook<void>;
          }),
        );
      }

      customParams.plugins =
        customParams.plugins !== undefined
          ? [...(extraLifeCyclePlugins as Plugin<TsParameters>[]), ...customParams.plugins]
          : (extraLifeCyclePlugins as Plugin<TsParameters>[]);

      await fc.assert(propertyInstance, customParams);
    },
    timeout,
  );
}
