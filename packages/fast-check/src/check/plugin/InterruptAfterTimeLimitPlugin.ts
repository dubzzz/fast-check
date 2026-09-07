import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { IRawProperty } from '../property/IRawProperty.js';
import { reportRunDetails } from '../runner/utils/RunDetailsFormatter.js';
import type { Plugin, PluginInstance } from './Plugin.js';

type Probe = {
  interruptedWhileRunning: boolean;
  running: boolean;
};

type Interrupt = {
  expired: () => boolean;
  clear: () => void;
  promise: Promise<PreconditionFailure>;
};

/** @internal */
function interruptAfterDelay(timeMs: number, probe: Probe): Interrupt {
  const limitTime = performance.now() + timeMs;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
  const promise = new Promise<PreconditionFailure>((resolve) => {
    timeoutHandle = setTimeout(() => {
      if (probe.running) {
        probe.interruptedWhileRunning = true;
      }
      resolve(new PreconditionFailure(true));
    }, timeMs);
  });
  return {
    expired: () => performance.now() >= limitTime,
    clear: () => clearTimeout(timeoutHandle),
    promise,
  };
}

/** @internal */
function timeLimitRunner(
  interrupt: Interrupt,
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
  probe: Probe,
): ReturnType<typeof nestedRun> {
  probe.running = true;
  if (interrupt.expired()) {
    probe.interruptedWhileRunning = true;
    probe.running = false;
    return new PreconditionFailure(true);
  }
  const runOut = nestedRun(value);
  if (runOut === null || !('then' in runOut)) {
    probe.running = false;
    return runOut;
  }
  void runOut.finally(() => (probe.running = false));
  return Promise.race([runOut, interrupt.promise]);
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
    const probe: Probe = { interruptedWhileRunning: false, running: false };
    const interrupt = interruptAfterDelay(timeLimitMs, probe);
    return {
      decorateRun: (nestedRun) => (value) => timeLimitRunner(interrupt, nestedRun, value, probe),
      onAllRunsComplete: (runDetails) => {
        interrupt.clear();
        if (options.failOnInterrupt && !runDetails.failed && runDetails.interrupted && probe.interruptedWhileRunning) {
          // TODO(v5) - Move to the async version instead
          return reportRunDetails({ ...runDetails, failed: true });
        }
      },
    };
  };
}
