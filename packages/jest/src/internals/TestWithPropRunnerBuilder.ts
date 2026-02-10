import { readConfigureGlobal } from 'fast-check';

import type { Parameters as FcParameters } from 'fast-check';
import type { State as JestCircusState } from 'jest-circus';
import type { Prop, PromiseProp, It, ArbitraryTuple, JestExtra, FcExtra } from './types.js';

function wrapProp<Ts extends [any] | any[]>(prop: Prop<Ts>): PromiseProp<Ts> {
  return (...args: Ts) => Promise.resolve(prop(...args));
}

type JestCircusDescribeBlock = JestCircusState['currentDescribeBlock'];
type JestCircusHook = JestCircusDescribeBlock['hooks'][number];

/**
 * Access jest-circus internal state by iterating over global symbols.
 * jest-circus uses Symbol('JEST_STATE_SYMBOL') (not Symbol.for),
 * so we must match by string representation.
 * Returns undefined when jest-jasmine2 or an unsupported runner is used.
 */
function getJestCircusState(): JestCircusState | undefined {
  const stateSymbolStringValue = String(Symbol('JEST_STATE_SYMBOL'));
  for (const key of Object.getOwnPropertySymbols(globalThis)) {
    if (String(key) === stateSymbolStringValue) {
      const jestState = (globalThis as any)[key];
      if (jestState !== null && typeof jestState === 'object') {
        return jestState as JestCircusState;
      }
    }
  }
  return undefined;
}

/**
 * Collect the describe block chain from the given block up to the root.
 * Returns the chain with the innermost block first.
 */
function getDescribeBlockChain(block: JestCircusDescribeBlock): JestCircusDescribeBlock[] {
  const chain: JestCircusDescribeBlock[] = [];
  let current: JestCircusDescribeBlock | undefined = block;
  while (current) {
    chain.push(current);
    current = current.parent;
  }
  return chain;
}

/**
 * Wrap a jest hook fn (which has `this: TestContext` and done-callback overloads)
 * into a simple `() => Promise<void>` callable. The cast is done once at collection time.
 */
function wrapHookFn(fn: JestCircusHook['fn']): () => Promise<void> {
  const hookFn = fn as (...args: unknown[]) => unknown;
  if (hookFn.length > 0) {
    // Done-callback style: fn(done)
    return () =>
      new Promise<void>((resolve, reject) => {
        hookFn((error?: string | Error) => {
          if (error) reject(typeof error === 'string' ? new Error(error) : error);
          else resolve();
        });
      });
  }
  // Promise or sync style: fn()
  return () => Promise.resolve(hookFn()).then(() => undefined);
}

/**
 * Collect beforeEach hooks in top-down order (root first),
 * matching jest-circus _getEachHooksForTest behavior.
 * Returns pre-wrapped callables for direct invocation.
 */
function collectJestBeforeEachHooks(block: JestCircusDescribeBlock): (() => Promise<void>)[] {
  const chain = getDescribeBlockChain(block);
  const hooks: (() => Promise<void>)[] = [];
  for (let i = chain.length - 1; i >= 0; i--) {
    for (const hook of chain[i].hooks) {
      if (hook.type === 'beforeEach') {
        hooks.push(wrapHookFn(hook.fn));
      }
    }
  }
  return hooks;
}

/**
 * Collect afterEach hooks in bottom-up order (current block first),
 * with hooks within each block in reverse registration order,
 * matching jest-circus _getEachHooksForTest behavior.
 * Returns pre-wrapped callables for direct invocation.
 */
function collectJestAfterEachHooks(block: JestCircusDescribeBlock): (() => Promise<void>)[] {
  const chain = getDescribeBlockChain(block);
  const hooks: (() => Promise<void>)[] = [];
  for (let i = 0; i < chain.length; i++) {
    const blockHooks = chain[i].hooks.filter((h) => h.type === 'afterEach');
    for (let j = blockHooks.length - 1; j >= 0; j--) {
      hooks.push(wrapHookFn(blockHooks[j].fn));
    }
  }
  return hooks;
}

export function buildTestWithPropRunner<Ts extends [any] | any[], TsParameters extends Ts = Ts>(
  testFn: It | It['only' | 'skip' | 'failing' | 'concurrent'] | It['concurrent']['only' | 'skip' | 'failing'],
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Ts>,
  params: FcParameters<TsParameters> | undefined,
  timeout: number | undefined,
  jest: JestExtra,
  fc: FcExtra,
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
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const jestTimeout = timeout !== undefined ? timeout : extractJestGlobalTimeout();
  if (jestTimeout !== undefined) {
    if (customParams.interruptAfterTimeLimit === undefined) {
      // Use the timeout specified at jest's level for interruptAfterTimeLimit
      customParams.interruptAfterTimeLimit = jestTimeout;
    } else {
      // Mix both jest and fc's timeouts
      customParams.interruptAfterTimeLimit = Math.min(customParams.interruptAfterTimeLimit, jestTimeout);
    }
  } else {
    // Related to ticket https://github.com/facebook/jest/issues/13338
    // May occur whenever test runner is not one of the uspported ones (see extractJestGLobalTimeout)
    // or if node version is 18.2.0 or above until the issue gets fixed on node side if confirmed
    console.warn('Unable to get back timeout of Jest, falling back onto Jest for global timeout handling');
  }

  const promiseProp = wrapProp(prop);

  // Instantiate property outside of testFn for the needs of worker-based version
  const propertyInstance = (fc.asyncProperty as any)(...(arbitraries as any), promiseProp);
  testFn(
    `${label} (with seed=${customParams.seed})`,
    async () => {
      // Hook into fc's property lifecycle to call jest's beforeEach/afterEach
      // between consecutive runs within the single test.
      //
      // Strategy (jest-circus only):
      //   - jest calls its own beforeEach before the test (covers 1st run)
      //   - fc property beforeEach between runs: jest afterEach + jest beforeEach
      //   - jest calls its own afterEach after the test (covers last run)
      //
      // Result: exactly N beforeEach + N afterEach for N property runs.
      const jestState = getJestCircusState();
      if (jestState?.currentlyRunningTest) {
        const testEntry = jestState.currentlyRunningTest;
        const describeBlock = testEntry.parent;
        const beforeEachHooks = collectJestBeforeEachHooks(describeBlock);
        const afterEachHooks = collectJestAfterEachHooks(describeBlock);

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
              await hook();
            }

            for (const hook of beforeEachHooks) {
              await hook();
            }
          });
        }
      }

      await fc.assert(propertyInstance, customParams);
    },
    jestTimeout !== undefined
      ? 0x7fffffff // must be 32-bit signed integer
      : undefined,
  );
}

function extractJestGlobalTimeout(): number | undefined {
  // Timeout defined via explicit calls to jest.setTimeout
  // See https://github.com/facebook/jest/blob/fb2de8a10f8e808b080af67aa771f67b5ea537ce/packages/jest-runtime/src/index.ts#L2174
  const jestTimeout = (globalThis as any)[Symbol.for('TEST_TIMEOUT_SYMBOL')];
  if (typeof jestTimeout === 'number') {
    return jestTimeout;
  }
  // Timeout defined via global configuration or CLI options (jest-circus runner, the default starting since Jest 27)
  const jestCircusState = getJestCircusState();
  if (jestCircusState !== undefined && typeof jestCircusState.testTimeout === 'number') {
    return jestCircusState.testTimeout;
  }
  // Timeout defined via global configuraton or CLI option (jest-jasmine2 runner, the default until Jest 26 included)
  if (typeof jasmine !== 'undefined') {
    return jasmine.DEFAULT_TIMEOUT_INTERVAL;
  }
  return undefined; // no such case expected
}
