import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { PredicateExecutionContext } from '../property/types/PredicateExecutionContext.js';
import type { Property } from '../property/types/Property.js';
import type { RunDetailsFailureInterrupted, RunDetailsSuccess } from '../runner/reporter/RunDetails.js';
import { reportRunDetails } from '../runner/utils/RunDetailsFormatter.js';
import type { PluginInstance, UniversalPlugin } from './Plugin.js';
import { mergeSignals, signalAsPromise } from './utils/Signals.js';

const safeSetTimeout = setTimeout;
const safeClearTimeout = clearTimeout;
const safePerformanceNow = performance.now.bind(performance);

type Probe = {
  interruptedWhileRunning: boolean;
  running: boolean;
};

type Interrupt = {
  expired: () => boolean;
  clear: () => void;
  promise: Promise<PreconditionFailure>;
  signal: AbortSignal;
};

function interruptAfterDelay(timeMs: number, probe: Probe): Interrupt {
  const limitTime = safePerformanceNow() + timeMs;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
  const abortController = new AbortController();
  const promise = new Promise<PreconditionFailure>((resolve) => {
    timeoutHandle = safeSetTimeout(() => {
      if (probe.running) {
        probe.interruptedWhileRunning = true;
      }
      const preconditionFailure = new PreconditionFailure(true);
      resolve(preconditionFailure);
      abortController.abort(preconditionFailure);
    }, timeMs);
  });
  return {
    expired: () => safePerformanceNow() >= limitTime,
    clear: () => safeClearTimeout(timeoutHandle),
    promise,
    signal: abortController.signal,
  };
}

function timeLimitRunner(
  interrupt: Interrupt,
  nestedRun: Property<unknown>['run'],
  value: unknown,
  executionContext: PredicateExecutionContext,
  probe: Probe,
): ReturnType<typeof nestedRun> {
  const signal = executionContext.signal;
  if (signal !== undefined && signal.aborted) {
    if (PreconditionFailure.isFailure(signal.reason)) {
      return signal.reason;
    }
    return { error: signal.reason };
  }
  probe.running = true;
  if (interrupt.expired()) {
    probe.interruptedWhileRunning = true;
    probe.running = false;
    return new PreconditionFailure(true);
  }
  const extendedExecutionContext = mergeSignals(executionContext, interrupt.signal);
  const runOut = nestedRun(value, extendedExecutionContext);
  if (runOut === null || !('then' in runOut)) {
    probe.running = false;
    return runOut;
  }
  void runOut.finally(() => (probe.running = false));
  if (signal === undefined) {
    return Promise.race([runOut, interrupt.promise]);
  }
  const sp = signalAsPromise(signal);
  const raced = Promise.race([runOut, interrupt.promise, sp.promise]);
  void runOut.finally(sp.clear);
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
 *   fc.property(..., async (...) => {...}),
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
): UniversalPlugin {
  return <Ts>(): PluginInstance<Ts> => {
    const probe: Probe = { interruptedWhileRunning: false, running: false };
    const interrupt = interruptAfterDelay(timeLimitMs, probe);
    return {
      decorateRun: (nestedRun) => (value, executionContext) =>
        timeLimitRunner(interrupt, nestedRun, value, executionContext, probe),
      onAllRunsComplete: (runDetails) => {
        interrupt.clear();
        if (options.failOnInterrupt && !runDetails.failed && runDetails.interrupted && probe.interruptedWhileRunning) {
          const successRunDetails: RunDetailsSuccess<Ts> = runDetails;
          const interruptedRunDetails: RunDetailsFailureInterrupted<Ts> = {
            ...successRunDetails,
            failed: true,
            interrupted: true,
          };
          // TODO(v5) - Move to the async version instead
          return reportRunDetails(interruptedRunDetails);
        }
      },
    };
  };
}
