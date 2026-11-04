import type { UniversalPlugin } from './Plugin.js';
import type {
  RunDetails,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
} from '../runner/reporter/RunDetails.js';
import { reportError } from '../runner/utils/RunDetailsFormatter.js';

function preFormatTooManySkipped<Ts>(out: RunDetailsFailureTooManySkips<Ts>) {
  const message = `Failed to run property, too many pre-condition failures encountered\n{ seed: ${out.seed} }\n\nRan ${out.numRuns} time(s)\nSkipped ${out.numSkips} time(s)`;
  const hints = [
    'Try to reduce the number of rejected values by combining map, chain and built-in arbitraries',
    'Increase failure tolerance by setting maxSkipsPerRun to an higher value',
  ];
  return { message, hints };
}

function prettyError(errorInstance: unknown) {
  // Print the Error message and its associated stacktrace
  if (errorInstance instanceof Error && errorInstance.stack !== undefined) {
    return errorInstance.stack; // stack includes the message
  }

  // First fallback: String(.)
  try {
    return String(errorInstance);
  } catch (_err) {
    // no-op
  }

  // Second fallback: Error::toString()
  if (errorInstance instanceof Error) {
    try {
      return Error.prototype.toString.call(errorInstance);
    } catch (_err) {
      // no-op
    }
  }

  // Third fallback: Object::toString()
  if (errorInstance !== null && typeof errorInstance === 'object') {
    try {
      return Object.prototype.toString.call(errorInstance);
    } catch (_err) {
      // no-op
    }
  }

  // Final fallback: Hardcoded string
  return 'Failed to serialize errorInstance';
}

function preFormatFailure<Ts>(out: RunDetailsFailureProperty<Ts>, stringifyOne: (value: Ts) => string) {
  const includeErrorInReport = out.runConfiguration.includeErrorInReport;
  const messageErrorPart = includeErrorInReport
    ? `\nGot ${prettyError(out.errorInstance).replace(/^Error: /, 'error: ')}`
    : '';
  const message = `Property failed after ${out.numRuns} tests\n{ seed: ${out.seed}, path: "${
    out.counterexamplePath
  }", endOnFailure: true }\nCounterexample: ${stringifyOne(out.counterexample)}\nShrunk ${
    out.numShrinks
  } time(s)${messageErrorPart}`;
  return { message };
}

function reportRunDetails<Ts>(out: RunDetails<Ts>): Promise<void> | void {
  if (!out.failed) {
    return;
  }
  return reportError(
    (stringifier) =>
      out.counterexamplePath === null ? preFormatTooManySkipped(out) : preFormatFailure(out, stringifier),
    out,
  );
}

/**
 * Report failed runs using fast-check's default error message.
 * Successful runs are left unchanged.
 *
 * @example
 * ```ts
 * await fc.assert(
 *   fc.property(fc.nat(), (n) => n >= 0),
 *   { noDefaultPlugins: true, plugins: [fc.defaultReporter()] }
 * );
 * ```
 *
 * @remarks Since 5.0.0
 * @public
 */
export function defaultReporter(): UniversalPlugin {
  return () => ({ onAllRunsComplete: reportRunDetails });
}
