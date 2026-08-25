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
  const propRun = Promise.race([nestedRun(value), t.promise]);
  propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
  return propRun;
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
