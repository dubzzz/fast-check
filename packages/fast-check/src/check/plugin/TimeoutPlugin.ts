import type { IRawProperty, PropertyFailure } from '../property/IRawProperty.js';
import { Error } from '../../utils/globals.js';
import type { Plugin, PluginInstance } from './Plugin.js';

/** @internal */
function timeoutAfter(timeMs: number) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
  const promise = new Promise<PropertyFailure>((resolve) => {
    timeoutHandle = setTimeout(() => {
      resolve({ error: new Error(`Property timeout: exceeded limit of ${timeMs} milliseconds`) });
    }, timeMs);
  });
  return {
    clear: () => clearTimeout(timeoutHandle),
    promise,
  };
}

/** @internal */
function timeoutRunner(
  timeMs: number,
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
): ReturnType<typeof nestedRun> {
  const t = timeoutAfter(timeMs);
  const runOut = nestedRun(value);
  if (runOut === null || !('then' in runOut)) {
    // synchronous run: it already came to an end, nothing to race against the timeout
    t.clear();
    return runOut;
  }
  const propRun = Promise.race([runOut, t.promise]);
  propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
  return propRun;
}

/**
 * Mark the execution of a predicate as failed if it exceeds `timeMs` milliseconds to complete.
 *
 * WARNING: It cannot stop a running predicate.
 * It mainly returns earlier so the test runner can move forward.
 *
 * NOTE: It has no effect on a synchronously running predicate.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.asyncProperty(..., async (...) => {...}),
 *   { plugins: [fc.timeout(1000)] }
 * )
 * ```
 *
 * @param timeMs - Maximal number of milliseconds granted to an execution of the predicate
 *
 * @remarks Since 4.10.0
 * @public
 */
export function timeout(timeMs: number): Plugin<unknown> {
  return (): PluginInstance<unknown> => {
    return {
      decorateRun: (nestedRun) => (value) => timeoutRunner(timeMs, nestedRun, value),
    };
  };
}
