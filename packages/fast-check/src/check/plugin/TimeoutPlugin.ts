import type { IRawProperty, PropertyFailure } from '../property/IRawProperty.js';
import { Error } from '../../utils/globals.js';
import type { Plugin, PluginInstance } from './Plugin.js';

const safeSetTimeout = setTimeout;
const safeClearTimeout = clearTimeout;

/** @internal */
function timeoutAfter(timeMs: number, setTimeoutSafe: typeof setTimeout, clearTimeoutSafe: typeof clearTimeout) {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const promise = new Promise<PropertyFailure>((resolve) => {
    timeoutHandle = setTimeoutSafe(() => {
      resolve({ error: new Error(`Property timeout: exceeded limit of ${timeMs} milliseconds`) });
    }, timeMs);
  });
  return {
    // `timeoutHandle` will always be initialised at this point: body of `new Promise` has already been executed
    // oxlint-disable-next-line typescript/no-non-null-assertion
    clear: () => clearTimeoutSafe(timeoutHandle!),
    promise,
  };
}

/** @internal */
function timeoutRunner(
  timeMs: number,
  setTimeoutSafe: typeof setTimeout,
  clearTimeoutSafe: typeof clearTimeout,
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
): ReturnType<typeof nestedRun> {
  const t = timeoutAfter(timeMs, setTimeoutSafe, clearTimeoutSafe);
  const runOut = nestedRun(value);
  if (runOut === null || !('then' in runOut)) {
    // synchronous run: it already came to an end, no need to wait for any timeout
    t.clear();
    return runOut;
  }
  const raced = Promise.race([runOut, t.promise]);
  raced.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
  return raced;
}

/** @internal */
export function buildTimeoutPlugin(
  timeMs: number,
  setTimeoutSafe: typeof setTimeout,
  clearTimeoutSafe: typeof clearTimeout,
): Plugin<unknown> {
  return (): PluginInstance<unknown> => {
    return {
      decorateRun: (nestedRun) => (value) => timeoutRunner(timeMs, setTimeoutSafe, clearTimeoutSafe, nestedRun, value),
    };
  };
}

/**
 * Fail the run of your predicate if it takes more than `timeMs` milliseconds to complete.
 * As predicates cannot be stopped, the underlying execution keeps running but its outcome gets ignored.
 *
 * Only useful for asynchronous properties: a synchronous predicate can never be observed timing out
 * as it already came to an end when we get its outcome.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.asyncProperty(..., async (...) => {...}),
 *   { plugins: [fc.timeoutPlugin(1000)] }
 * )
 * ```
 *
 * @param timeMs - Maximal number of milliseconds granted to an execution of the predicate
 *
 * @remarks Since 4.10.0
 * @public
 */
export function timeout(timeMs: number): Plugin<unknown> {
  return buildTimeoutPlugin(timeMs, safeSetTimeout, safeClearTimeout);
}
