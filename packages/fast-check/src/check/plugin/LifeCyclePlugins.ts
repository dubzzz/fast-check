import type { IRawProperty } from '../property/IRawProperty.js';
import type { Plugin, PluginInstance } from './Plugin.js';

const LifeCyclePluginSymbol = Symbol.for('fast-check/plugin/life-cycle');

type TeardownFunction = () => Promise<void> | void;
type AfterEachHook = () => Promise<void> | void;
type BeforeEachHook = () => Promise<void | TeardownFunction> | void | TeardownFunction;
type LifeCycleHooks = {
  lastPluginIndex: number;
  beforeHooks: BeforeEachHook[];
  beforeHooksIndices: number[];
  afterHooks: AfterEachHook[];
  afterHooksIndices: number[];
};

type TeardownStore = {
  fns: TeardownFunction[];
  // Index within hooks.beforeHooks of the before hook that returned the teardown
  hookIndices: number[];
};

function addTeardown(store: TeardownStore | null, hookIndex: number, fn: TeardownFunction): TeardownStore {
  // Stores are allocated lazily: most of the runs do not register any teardown,
  // they should not pay any extra allocation for them
  if (store === null) {
    store = { fns: [], hookIndices: [] };
  }
  store.fns.push(fn);
  store.hookIndices.push(hookIndex);
  return store;
}

function computeResultingAfterHooks(teardowns: TeardownStore | null, hooks: LifeCycleHooks) {
  if (teardowns === null) {
    return hooks.afterHooks;
  }
  const teardownFns = teardowns.fns;
  const afterHooks = hooks.afterHooks;
  if (afterHooks.length === 0) {
    return teardownFns;
  }
  // Merge teardowns and after hooks in increasing order of plugin index.
  // Both lists are already ordered by plugin index: teardowns are registered while running
  // the before hooks in order and after hooks are registered at plugin instantiation.
  const beforeHooksIndices = hooks.beforeHooksIndices;
  const afterHooksIndices = hooks.afterHooksIndices;
  const teardownHookIndices = teardowns.hookIndices;
  const merged: (TeardownFunction | AfterEachHook)[] = [];
  let teardownCursor = 0;
  let afterCursor = 0;
  while (teardownCursor !== teardownFns.length && afterCursor !== afterHooks.length) {
    if (beforeHooksIndices[teardownHookIndices[teardownCursor]] < afterHooksIndices[afterCursor]) {
      merged.push(teardownFns[teardownCursor]);
      ++teardownCursor;
    } else {
      merged.push(afterHooks[afterCursor]);
      ++afterCursor;
    }
  }
  while (teardownCursor !== teardownFns.length) {
    merged.push(teardownFns[teardownCursor]);
    ++teardownCursor;
  }
  while (afterCursor !== afterHooks.length) {
    merged.push(afterHooks[afterCursor]);
    ++afterCursor;
  }
  return merged;
}

function lifeCycleHooksRunner(
  hooks: LifeCycleHooks,
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
): ReturnType<typeof nestedRun> {
  let wrappedRunOutput: Awaited<ReturnType<typeof nestedRun>> = null; // null means success
  let wrappedRunContinuation: Promise<Awaited<ReturnType<typeof nestedRun>>> | undefined = undefined;

  // Before hooks
  let teardowns: TeardownStore | null = null;
  const beforeHooks = hooks.beforeHooks;
  if (beforeHooks.length !== 0) {
    try {
      for (let index = 0; index !== beforeHooks.length; ++index) {
        const before = beforeHooks[index];
        if (wrappedRunContinuation === undefined) {
          const out = before();
          if (typeof out === 'function') {
            teardowns = addTeardown(teardowns, index, out);
          }
          if (typeof out === 'object') {
            wrappedRunContinuation = out.then((beforeOut) => {
              if (beforeOut !== undefined) {
                teardowns = addTeardown(teardowns, index, beforeOut);
              }
              return null;
            });
          }
        } else {
          wrappedRunContinuation = wrappedRunContinuation.then(() => {
            const beforeOut = before();
            if (beforeOut === undefined) {
              return null;
            }
            if (typeof beforeOut === 'function') {
              teardowns = addTeardown(teardowns, index, beforeOut);
              return null;
            }
            return beforeOut.then((beforeOutNested) => {
              if (beforeOutNested !== undefined) {
                teardowns = addTeardown(teardowns, index, beforeOutNested);
              }
              return null;
            });
          });
        }
      }
    } catch (error) {
      wrappedRunOutput = { error };
    }
  }

  // Predicate

  if (wrappedRunOutput === null) {
    if (wrappedRunContinuation === undefined) {
      // We are currently into a sync flow
      const out = nestedRun(value);
      if (out !== null && 'then' in out) {
        wrappedRunContinuation = out;
      } else {
        wrappedRunOutput = out;
      }
    } else {
      // We switched to an async flow
      wrappedRunContinuation = wrappedRunContinuation.then(
        () => nestedRun(value),
        (error) => ({ error }), // beforeEach flows do not catch anything, they always result into succes being null or throw
      );
    }
  }

  // After hooks
  if (wrappedRunContinuation === undefined) {
    const resultingAfterHooks = computeResultingAfterHooks(teardowns, hooks);
    for (let index = resultingAfterHooks.length - 1; index >= 0; --index) {
      const after = resultingAfterHooks[index];
      if (wrappedRunContinuation === undefined) {
        try {
          const out = after();
          if (typeof out === 'object') {
            wrappedRunContinuation = out.then(
              () => wrappedRunOutput,
              // TODO Switch to ?? when the node range defined by fast-check accepts it
              (error) => wrappedRunOutput || { error },
            );
          }
        } catch (error) {
          wrappedRunOutput = { error };
        }
      } else {
        wrappedRunContinuation = wrappedRunContinuation.then((previous) => {
          try {
            const out = after();
            if (typeof out === 'object') {
              return out.then(
                () => previous,
                // TODO Switch to ?? when the node range defined by fast-check accepts it
                (error) => previous || { error },
              );
            }
            return previous;
          } catch (error) {
            // TODO Switch to ?? when the node range defined by fast-check accepts it
            return previous || { error };
          }
        });
      }
    }
  } else {
    wrappedRunContinuation = wrappedRunContinuation.then((previousBeforeAfters) => {
      const resultingAfterHooks = computeResultingAfterHooks(teardowns, hooks);
      if (resultingAfterHooks.length === 0) {
        return previousBeforeAfters;
      }
      let afterContinuation: Promise<Awaited<ReturnType<typeof nestedRun>>> = Promise.resolve(previousBeforeAfters);
      for (let index = resultingAfterHooks.length - 1; index >= 0; --index) {
        const after = resultingAfterHooks[index];
        afterContinuation = afterContinuation.then((previous) => {
          try {
            const out = after();
            return out === undefined
              ? previous
              : out.then(
                  () => previous,
                  // TODO Switch to ?? when the node range defined by fast-check accepts it
                  (error) => previous || { error },
                );
          } catch (error) {
            // TODO Switch to ?? when the node range defined by fast-check accepts it
            return previous || { error };
          }
        });
      }
      return afterContinuation;
    });
  }

  return wrappedRunContinuation === undefined ? wrappedRunOutput : wrappedRunContinuation;
}

/**
 * Register a callback to be called before each run of your predicate.
 * If the function returns a promise, we wait until the promise resolves before running anything else.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.beforeEach(() => {...})] }
 * )
 * ```
 *
 * @param fn - Hook to be executed before each execution of the predicate
 *
 * @remarks Since 4.10.0
 * @public
 */
export function beforeEach(fn: BeforeEachHook): Plugin<unknown> {
  return (pluginIndex, crossPluginContext): PluginInstance<unknown> => {
    let lifeCycleHooks = crossPluginContext[LifeCyclePluginSymbol] as LifeCycleHooks | undefined;
    if (lifeCycleHooks !== undefined && lifeCycleHooks.lastPluginIndex === pluginIndex - 1) {
      lifeCycleHooks.lastPluginIndex = pluginIndex;
      lifeCycleHooks.beforeHooks.push(fn);
      lifeCycleHooks.beforeHooksIndices.push(pluginIndex);
      return {};
    }
    lifeCycleHooks = {
      lastPluginIndex: pluginIndex,
      beforeHooks: [fn],
      beforeHooksIndices: [pluginIndex],
      afterHooks: [],
      afterHooksIndices: [],
    };
    crossPluginContext[LifeCyclePluginSymbol] = lifeCycleHooks;
    return { decorateRun: (nestedRun) => (value) => lifeCycleHooksRunner(lifeCycleHooks, nestedRun, value) };
  };
}

/**
 * Register a callback to be called after each run of your predicate.
 * If the function returns a promise, we wait until the promise resolves before running anything else.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.afterEach(() => {...})] }
 * )
 * ```
 *
 * @param fn - Hook to be executed after each execution of the predicate
 *
 * @remarks Since 4.10.0
 * @public
 */
export function afterEach(fn: AfterEachHook): Plugin<unknown> {
  return (pluginIndex, crossPluginContext): PluginInstance<unknown> => {
    let lifeCycleHooks = crossPluginContext[LifeCyclePluginSymbol] as LifeCycleHooks | undefined;
    if (lifeCycleHooks !== undefined && lifeCycleHooks.lastPluginIndex === pluginIndex - 1) {
      lifeCycleHooks.lastPluginIndex = pluginIndex;
      lifeCycleHooks.afterHooks.push(fn);
      lifeCycleHooks.afterHooksIndices.push(pluginIndex);
      return {};
    }
    lifeCycleHooks = {
      lastPluginIndex: pluginIndex,
      beforeHooks: [],
      beforeHooksIndices: [],
      afterHooks: [fn],
      afterHooksIndices: [pluginIndex],
    };
    crossPluginContext[LifeCyclePluginSymbol] = lifeCycleHooks;
    return { decorateRun: (nestedRun) => (value) => lifeCycleHooksRunner(lifeCycleHooks, nestedRun, value) };
  };
}
