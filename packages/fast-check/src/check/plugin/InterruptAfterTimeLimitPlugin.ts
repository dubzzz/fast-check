import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { IRawProperty } from '../property/IRawProperty.js';
import { reportRunDetails } from '../runner/utils/RunDetailsFormatter.js';
import type { Plugin, PluginInstance } from './Plugin.js';

/** @internal */
function interruptAfterDelay(timeMs: number, interruptedRef: { current: boolean }) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
  const promise = new Promise<PreconditionFailure>((resolve) => {
    timeoutHandle = setTimeout(() => {
      interruptedRef.current = true;
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
  interruptedRef: { current: boolean },
): ReturnType<typeof nestedRun> {
  const remainingTime = limitTime - performance.now();
  if (remainingTime <= 0) {
    interruptedRef.current = true;
    return new PreconditionFailure(true);
  }
  const t = interruptAfterDelay(remainingTime, interruptedRef);
  const runOut = nestedRun(value);
  if (runOut === null || !('then' in runOut)) {
    // synchronous run: it already came to an end, nothing to race against the interruption
    t.clear();
    return runOut;
  }
  const raced = Promise.race([runOut, t.promise]);
  raced.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
  return raced;
}

/**
 * Options for {@link interruptAfterTimeLimit}
 * @remarks Since 4.10.0
 * @public
 */
export type InterruptAfterTimeLimitOptions = {
  /**
   * Whether an interruption triggered by this plugin should be reported as a failure.
   * When set to `true`, a property interrupted before reaching `numRuns` is reported as a failure.
   *
   * @defaultValue `false`
   * @remarks Since 4.10.0
   */
  failOnInterrupt?: boolean;
};

/**
 * Interrupt test execution after a given time limit.
 *
 * NOTE: Useful to avoid having too long running processes in your CI while preserving replay capabilities if needed.
 *
 * WARNING: A test interrupted before any failure counts as a success, even if it did not
 * reach `numRuns` runs, unless `failOnInterrupt` is set to `true`.
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
export function interruptAfterTimeLimit(
  timeLimitMs: number,
  options: InterruptAfterTimeLimitOptions = {},
): Plugin<unknown> {
  return (): PluginInstance<unknown> => {
    const limitTime = performance.now() + timeLimitMs;
    const interruptedRef = { current: false };
    return {
      decorateRun: (nestedRun) => (value) => timeLimitRunner(limitTime, nestedRun, value, interruptedRef),
      onAllRunsComplete: options.failOnInterrupt
        ? (runDetails) => {
            if (!runDetails.failed && runDetails.interrupted && interruptedRef.current) {
              // TODO(v5) - Move to the async version instead
              return reportRunDetails({ ...runDetails, failed: true });
            }
          }
        : undefined,
    };
  };
}
