import { PreconditionFailure } from 'fast-check';
import type { PredicateExecutionContext } from '../property/types/PredicateExecutionContext.js';
import type { Property } from '../property/types/Property.js';
import type { PropertyFailure } from '../property/types/PropertyFailure.js';
import type { UniversalPlugin } from './Plugin.js';
import { mergeSignals, signalAsPromise } from './utils/Signals.js';

const safeSetTimeout = setTimeout;
const safeClearTimeout = clearTimeout;
const safePerformanceNow = performance.now.bind(performance);

function timeoutAfter(timeMs: number) {
  const limitTime = safePerformanceNow() + timeMs;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
  const abortController = new AbortController();
  const getFailure = (): PropertyFailure => ({
    error: abortController.signal.aborted
      ? abortController.signal.reason
      : new Error(`Property timeout: exceeded limit of ${timeMs} milliseconds`),
  });
  const promise = new Promise<PropertyFailure>((resolve) => {
    timeoutHandle = safeSetTimeout(() => {
      const failure = getFailure();
      resolve(failure);
      abortController.abort(failure.error);
    }, timeMs);
  });
  return {
    check: (out: PreconditionFailure | PropertyFailure | null) => {
      // Blocking work may complete before the event loop can run the timeout callback.
      if (safePerformanceNow() >= limitTime) {
        const failure = getFailure();
        abortController.abort(failure.error);
        return failure;
      }
      return out;
    },
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
  const signal = executionContext.signal;
  if (signal !== undefined && signal.aborted) {
    if (PreconditionFailure.isFailure(signal.reason)) {
      return signal.reason;
    }
    return { error: signal.reason };
  }
  const t = timeoutAfter(timeMs);
  const extendedExecutionContext = mergeSignals(executionContext, t.signal);
  const runOut = nestedRun(value, extendedExecutionContext);
  if (runOut === null || !('then' in runOut)) {
    // synchronous run: it already came to an end, nothing to race against the timeout
    t.clear();
    return t.check(runOut);
  }

  const checkedRunOut = runOut.then(t.check);
  if (signal === undefined) {
    const propRun = Promise.race([checkedRunOut, t.promise]);
    propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
    return propRun;
  }
  const sp = signalAsPromise(signal);
  const propRun = Promise.race([checkedRunOut, t.promise, sp.promise]);
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
 * Synchronous work cannot be interrupted, but is reported as a failure if it reaches the time limit.
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
