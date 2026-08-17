import type { IRawProperty, PropertyFailure } from '../property/IRawProperty.js';
import type { Plugin, PluginInstance } from './Plugin.js';

// if b throws in a sync or async manner:
// - next b are not fired
// - but a are fired

// if b returns sync or async a f it gets executed after all others a
// nested first
// except if one of the bs threw

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
