import type { IRawProperty } from '../property/IRawProperty.js';
import type { Plugin, PluginInstance } from './Plugin.js';

const LifeCyclePluginSymbol = Symbol.for('fast-check/plugin/life-cycle');

type TeardownFunction = () => Promise<void> | void;
type AfterEachHook = () => Promise<void> | void;
type BeforeEachHook = () => Promise<void | TeardownFunction> | void | TeardownFunction;
type LifeCycleHooks = { lastPluginIndex: number; beforeHooks: BeforeEachHook[]; afterHooks: AfterEachHook[] };

function lifeCycleHooksRunner(
  hooks: LifeCycleHooks,
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
): ReturnType<typeof nestedRun> {
  let wrappedRunOutput: Awaited<ReturnType<typeof nestedRun>> = null; // null means success
  let wrappedRunContinuation: Promise<Awaited<ReturnType<typeof nestedRun>>> | undefined = undefined;

  // Before hooks
  const teardownFunctions: TeardownFunction[] = [];
  if (hooks.beforeHooks.length !== 0) {
    try {
      for (const before of hooks.beforeHooks) {
        if (wrappedRunContinuation === undefined) {
          const out = before();
          if (typeof out === 'function') {
            teardownFunctions.push(out);
          }
          if (typeof out === 'object') {
            wrappedRunContinuation = out.then((beforeOut) => {
              if (beforeOut !== undefined) {
                teardownFunctions.push(beforeOut);
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
              teardownFunctions.push(beforeOut);
              return null;
            }
            return beforeOut.then((beforeOutNested) => {
              if (beforeOutNested !== undefined) {
                teardownFunctions.push(beforeOutNested);
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
    const allSyncAfterHooks =
      teardownFunctions.length === 0 ? hooks.afterHooks : [...teardownFunctions, ...hooks.afterHooks];
    for (let index = allSyncAfterHooks.length - 1; index >= 0; --index) {
      const after = allSyncAfterHooks[index];
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
      const allSyncAfterHooks =
        teardownFunctions.length === 0 ? hooks.afterHooks : [...teardownFunctions, ...hooks.afterHooks];
      if (allSyncAfterHooks.length === 0) {
        return previousBeforeAfters;
      }
      let afterContinuation: Promise<Awaited<ReturnType<typeof nestedRun>>> = Promise.resolve(previousBeforeAfters);
      for (let index = allSyncAfterHooks.length - 1; index >= 0; --index) {
        const after = allSyncAfterHooks[index];
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
      return {};
    }
    lifeCycleHooks = { lastPluginIndex: pluginIndex, beforeHooks: [fn], afterHooks: [] };
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
      return {};
    }
    lifeCycleHooks = { lastPluginIndex: pluginIndex, beforeHooks: [], afterHooks: [fn] };
    crossPluginContext[LifeCyclePluginSymbol] = lifeCycleHooks;
    return { decorateRun: (nestedRun) => (value) => lifeCycleHooksRunner(lifeCycleHooks, nestedRun, value) };
  };
}
