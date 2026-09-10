import type { IRawProperty, PropertyFailure } from '../property/IRawProperty.js';
import type { PreconditionFailure } from '../precondition/PreconditionFailure.js';
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

function computeResultingAfterHooks(
  teardownFunctions: { index: number; fn: TeardownFunction }[],
  hooks: LifeCycleHooks,
) {
  if (teardownFunctions.length === 0) {
    return hooks.afterHooks;
  }
  if (hooks.afterHooks.length === 0) {
    return teardownFunctions.map((details) => details.fn);
  }
  const afterAndPluginIndices: { index: number; fn: TeardownFunction | AfterEachHook }[] = [];
  for (const value of teardownFunctions) {
    const { index, fn } = value;
    afterAndPluginIndices.push({ index: hooks.beforeHooksIndices[index], fn });
  }
  for (let index = 0; index !== hooks.afterHooks.length; ++index) {
    afterAndPluginIndices.push({ index: hooks.afterHooksIndices[index], fn: hooks.afterHooks[index] });
  }
  afterAndPluginIndices.sort((a, b) => a.index - b.index);
  return afterAndPluginIndices.map((details) => details.fn);
}

type PredicateOutput = PreconditionFailure | PropertyFailure | null; // null means success

/**
 * Run all the before hooks starting at startIndex, in declaration order.
 * Stays fully synchronous while hooks are synchronous: a Promise is only allocated when one of the
 * hooks returns one, in which case the remaining hooks get executed by re-entering this very same
 * loop from within the resolution of the Promise.
 * Returns null when everything ran synchronously. A before hook throwing synchronously propagates
 * to the caller (or rejects the returned Promise when already in an asynchronous flow).
 */
function runBeforeHooks(
  hooks: LifeCycleHooks,
  teardownFunctions: { index: number; fn: TeardownFunction }[],
  startIndex: number,
): Promise<null> | null {
  const beforeHooks = hooks.beforeHooks;
  for (let index = startIndex; index !== beforeHooks.length; ++index) {
    const out = beforeHooks[index]();
    if (typeof out === 'function') {
      teardownFunctions.push({ index, fn: out });
    } else if (typeof out === 'object') {
      const asyncIndex = index;
      return out.then((beforeOut) => {
        if (beforeOut !== undefined) {
          teardownFunctions.push({ index: asyncIndex, fn: beforeOut });
        }
        return runBeforeHooks(hooks, teardownFunctions, asyncIndex + 1);
      });
    }
  }
  return null;
}

/**
 * Run all the after hooks and teardowns from startIndex down to 0 (they run in reverse order).
 * Stays fully synchronous while hooks are synchronous: a Promise is only allocated when one of the
 * hooks returns one, in which case the remaining hooks get executed by re-entering this very same
 * loop from within the settlement of the Promise.
 * All the hooks always run: a failing one never stops the others. The first failure encountered
 * only becomes the output when previous was a success.
 */
function runAfterHooks(
  resultingAfterHooks: (TeardownFunction | AfterEachHook)[],
  startIndex: number,
  previous: PredicateOutput,
): Promise<PredicateOutput> | PredicateOutput {
  for (let index = startIndex; index >= 0; --index) {
    let out: Promise<void> | void = undefined;
    try {
      out = resultingAfterHooks[index]();
    } catch (error) {
      // TODO Switch to ?? when the node range defined by fast-check accepts it
      previous = previous || { error };
    }
    if (typeof out === 'object') {
      const asyncIndex = index;
      const previousSoFar = previous;
      return out.then(
        () => runAfterHooks(resultingAfterHooks, asyncIndex - 1, previousSoFar),
        // TODO Switch to ?? when the node range defined by fast-check accepts it
        (error) => runAfterHooks(resultingAfterHooks, asyncIndex - 1, previousSoFar || { error }),
      );
    }
  }
  return previous;
}

function lifeCycleHooksRunner(
  hooks: LifeCycleHooks,
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
): ReturnType<typeof nestedRun> {
  const teardownFunctions: { index: number; fn: TeardownFunction }[] = [];

  function runAfterPart(previous: PredicateOutput): Promise<PredicateOutput> | PredicateOutput {
    const resultingAfterHooks = computeResultingAfterHooks(teardownFunctions, hooks);
    return runAfterHooks(resultingAfterHooks, resultingAfterHooks.length - 1, previous);
  }

  function runPredicateAndAfterPart(): Promise<PredicateOutput> | PredicateOutput {
    const out = nestedRun(value);
    if (out !== null && 'then' in out) {
      return out.then(runAfterPart);
    }
    return runAfterPart(out);
  }

  let beforeContinuation: Promise<null> | null = null;
  try {
    beforeContinuation = runBeforeHooks(hooks, teardownFunctions, 0);
  } catch (error) {
    return runAfterPart({ error });
  }
  if (beforeContinuation === null) {
    return runPredicateAndAfterPart();
  }
  return beforeContinuation.then(
    runPredicateAndAfterPart,
    (error) => runAfterPart({ error }), // beforeEach flows do not catch anything, they always result into success being null or throw
  );
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
  return (pluginIndex, pluginStore): PluginInstance<unknown> => {
    let lifeCycleHooks = pluginStore.get<LifeCycleHooks>(LifeCyclePluginSymbol);
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
    pluginStore.set(LifeCyclePluginSymbol, lifeCycleHooks);
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
  return (pluginIndex, pluginStore): PluginInstance<unknown> => {
    let lifeCycleHooks = pluginStore.get<LifeCycleHooks>(LifeCyclePluginSymbol);
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
    pluginStore.set(LifeCyclePluginSymbol, lifeCycleHooks);
    return { decorateRun: (nestedRun) => (value) => lifeCycleHooksRunner(lifeCycleHooks, nestedRun, value) };
  };
}
