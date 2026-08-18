import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { IRawProperty } from '../property/IRawProperty.js';
import type { Plugin, PluginInstance } from './Plugin.js';

/** @internal */
function interruptAfterDelay(timeMs: number) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
  const promise = new Promise<PreconditionFailure>((resolve) => {
    timeoutHandle = setTimeout(() => {
      resolve(new PreconditionFailure(true));
    }, timeMs);
  });
  return {
    clear: () => clearTimeout(timeoutHandle),
    promise,
  };
}

/** @internal */
function timeLimitRunner(
  limitTime: number,
  interruptExecution: boolean,
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
): ReturnType<typeof nestedRun> {
  const remainingTime = limitTime - Date.now();
  if (remainingTime <= 0) {
    return new PreconditionFailure(interruptExecution);
  }
  if (!interruptExecution) {
    return nestedRun(value);
  }
  const t = interruptAfterDelay(remainingTime);
  const runOut = nestedRun(value);
  if (runOut === null || !('then' in runOut)) {
    // synchronous run: it already came to an end, no need to wait for any interruption
    t.clear();
    return runOut;
  }
  const raced = Promise.race([runOut, t.promise]);
  raced.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
  return raced;
}

/** @internal */
function buildTimeLimitPlugin(timeLimitMs: number, interruptExecution: boolean): Plugin<unknown> {
  return (): PluginInstance<unknown> => {
    const limitTime = Date.now() + timeLimitMs;
    return {
      decorateRun: (nestedRun) => (value) => timeLimitRunner(limitTime, interruptExecution, nestedRun, value),
    };
  };
}

/**
 * Skip any execution of the predicate starting after `timeLimitMs` milliseconds.
 * The clock starts when the property begins to be assessed, executions already started are left running.
 * Skipped executions count as skips: passed the maximal number of skips the run will be marked as failed.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.skipAllAfterTimeLimitPlugin(1000)] }
 * )
 * ```
 *
 * @param timeLimitMs - Delay in milliseconds after which executions of the predicate get skipped
 *
 * @remarks Since 4.10.0
 * @public
 */
export function skipAllAfterTimeLimit(timeLimitMs: number): Plugin<unknown> {
  return buildTimeLimitPlugin(timeLimitMs, false);
}

/**
 * Interrupt the run after `timeLimitMs` milliseconds: no more execution of the predicate will be started
 * and any execution still running at that time will be interrupted (as predicates cannot be stopped, the
 * underlying execution keeps running but its outcome gets ignored).
 * The clock starts when the property begins to be assessed.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.asyncProperty(..., async (...) => {...}),
 *   { plugins: [fc.interruptAfterTimeLimitPlugin(1000)] }
 * )
 * ```
 *
 * @param timeLimitMs - Delay in milliseconds after which the run gets interrupted
 *
 * @remarks Since 4.10.0
 * @public
 */
export function interruptAfterTimeLimit(timeLimitMs: number): Plugin<unknown> {
  return buildTimeLimitPlugin(timeLimitMs, true);
}
