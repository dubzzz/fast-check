import type { IRawProperty, PropertyFailure } from '../property/IRawProperty.js';
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
  let beforeContinuation: Promise<void> | undefined = undefined;
  let beforeFailed: PropertyFailure | undefined = undefined;
  if (hooks.beforeHooks.length !== 0) {
    try {
      for (const before of hooks.beforeHooks) {
        if (beforeContinuation === undefined) {
          const out = before();
          if (typeof out === 'object') {
            beforeContinuation = out;
          }
        } else {
          beforeContinuation = beforeContinuation.then(() => before());
        }
      }
    } catch (error) {
      beforeFailed = { error };
    }
  }
  const runOut: ReturnType<typeof nestedRun> =
    beforeFailed === undefined
      ? beforeContinuation === undefined
        ? nestedRun(value)
        : beforeContinuation.then(
            () => nestedRun(value),
            (error) => ({ error }),
          )
      : beforeFailed;
  return runOut;
}

/**
 * Register a callback to be called before each run of your predicate.
 * If the function returns a promise, we wait until the promise resolves before running anything else.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.beforeEachPlugin(() => {...})] }
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
