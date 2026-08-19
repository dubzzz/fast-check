import type { IRawProperty } from '../property/IRawProperty.js';
import type { Plugin, PluginInstance } from './Plugin.js';

const LifeCyclePluginSymbol = Symbol.for('fast-check/plugin/life-cycle');

type AfterEachHook = () => Promise<void> | void;
type BeforeEachHook = () => Promise<void> | void;
type LifeCycleHooks = { lastPluginIndex: number; beforeHooks: BeforeEachHook[]; afterHooks: AfterEachHook[] };

function lifeCycleHooksRunner(
  hooks: LifeCycleHooks,
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
): ReturnType<typeof nestedRun> {
  let wrappedRunOutput: Awaited<ReturnType<typeof nestedRun>> = null; // null means success
  let beforeEachContinuation: Promise<void> | undefined = undefined;

  // Before hooks
  if (hooks.beforeHooks.length !== 0) {
    try {
      for (const before of hooks.beforeHooks) {
        if (beforeEachContinuation === undefined) {
          const out = before();
          if (typeof out === 'object') {
            beforeEachContinuation = out;
          }
        } else {
          beforeEachContinuation = beforeEachContinuation.then(() => before());
        }
      }
    } catch (error) {
      wrappedRunOutput = { error };
    }
  }

  // Predicate
  let wrappedRunContinuation: Promise<Awaited<ReturnType<typeof nestedRun>>> | undefined = undefined;
  if (wrappedRunOutput === null) {
    if (beforeEachContinuation === undefined) {
      // We are currently into a sync flow
      const out = nestedRun(value);
      if (out !== null && 'then' in out) {
        wrappedRunContinuation = out;
      } else {
        wrappedRunOutput = out;
      }
    } else {
      // We switched to an async flow
      wrappedRunContinuation = beforeEachContinuation.then(
        () => nestedRun(value),
        (error) => ({ error }), // beforeEach flows do not catch anything, they always result into succes being null or throw
      );
    }
  }

  // After hooks
  for (let index = hooks.afterHooks.length - 1; index >= 0; --index) {
    const after = hooks.afterHooks[index];
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
 *   { plugins: [fc.afterEachPlugin(() => {...})] }
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
