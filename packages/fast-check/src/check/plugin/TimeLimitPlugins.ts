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
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
): ReturnType<typeof nestedRun> {
  const remainingTime = limitTime - performance.now();
  if (remainingTime <= 0) {
    return new PreconditionFailure(true);
  }
  const t = interruptAfterDelay(remainingTime);
  const raced = Promise.race([nestedRun(value), t.promise]);
  raced.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
  return raced;
}

/**
 * Interrupt test execution after a given time limit.
 *
 * NOTE:  Useful to avoid having too long running processes in your CI while preserving replay capabilities if needed.
 *
 * WARNING: If the test got interrupted before any failure occured and before it reached
 * the requested number of runs specified by `numRuns` it will be marked as success.
 * Except if `markInterruptAsFailure` has been set to `true`.
 *
 * As predicates cannot be stopped, the underlying execution keeps running but its outcome gets ignored.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.asyncProperty(..., async (...) => {...}),
 *   { plugins: [fc.interruptAfterTimeLimit(1000)] }
 * )
 * ```
 *
 * @param timeLimitMs - Delay in milliseconds after which runs gets interrupted
 *
 * @remarks Since 4.10.0
 * @public
 */
export function interruptAfterTimeLimit(timeLimitMs: number): Plugin<unknown> {
  return (): PluginInstance<unknown> => {
    const limitTime = performance.now() + timeLimitMs;
    return {
      decorateRun: (nestedRun) => (value) => timeLimitRunner(limitTime, nestedRun, value),
    };
  };
}
