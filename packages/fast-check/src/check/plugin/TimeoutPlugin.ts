import { PreconditionFailure } from 'fast-check';
import type { PredicateExecutionContext } from '../property/types/PredicateExecutionContext.js';
import type { Property } from '../property/types/Property.js';
import type { PropertyFailure } from '../property/types/PropertyFailure.js';
import type { UniversalPlugin } from './Plugin.js';
import { mergeSignals, signalAsPromise } from './utils/Signals.js';

const safeSetTimeout = setTimeout;
const safeClearTimeout = clearTimeout;

function timeoutAfter(timeMs: number) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
  const abortController = new AbortController();
  const promise = new Promise<PropertyFailure>((resolve) => {
    timeoutHandle = safeSetTimeout(() => {
      const error = new Error(`Property timeout: exceeded limit of ${timeMs} milliseconds`);
      resolve({ error });
      abortController.abort(error);
    }, timeMs);
  });
  return {
    clear: () => safeClearTimeout(timeoutHandle),
    promise,
    signal: abortController.signal,
  };
}

function timeoutRunner(
  timeMs: number,
  nestedRun: Property<unknown>['run'],
  value: unknown,
  executionContext: PredicateExecutionContext,
): ReturnType<typeof nestedRun> {
  const t = timeoutAfter(timeMs);
  const signal = executionContext.signal;
  if (signal !== undefined && signal.aborted) {
    if (PreconditionFailure.isFailure(signal.reason)) {
      return signal.reason;
    }
    return { error: signal.reason };
  }
  const extendedExecutionContext = mergeSignals(executionContext, t.signal);
  const runOut = nestedRun(value, extendedExecutionContext);
  if (runOut === null || !('then' in runOut)) {
    // synchronous run: it already came to an end, nothing to race against the timeout
    t.clear();
    return runOut;
  }

  if (signal === undefined) {
    const propRun = Promise.race([runOut, t.promise]);
    propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
    return propRun;
  }
  const sp = signalAsPromise(signal);
  const propRun = Promise.race([runOut, t.promise, sp.promise]);
  const clear = () => {
    t.clear();
    sp.clear();
  };
  propRun.then(clear, clear); // always clear timeout handle - catch should never occur
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
 *   fc.property(..., async (...) => {...}),
 *   { plugins: [fc.timeout(1000)] }
 * )
 * ```
 *
 * @param timeMs - Maximal number of milliseconds granted to an execution of the predicate
 *
 * @remarks Since 4.10.0
 * @public
 */
export function timeout(timeMs: number): UniversalPlugin {
  return () => {
    return {
      decorateRun: (nestedRun) => (value, executionContext) =>
        timeoutRunner(timeMs, nestedRun, value, executionContext),
    };
  };
}
