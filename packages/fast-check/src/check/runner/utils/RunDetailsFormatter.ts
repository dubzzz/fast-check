import { Error, safeErrorToString, safePush, safeReplace, safeToString, String } from '../../../utils/globals';
import { stringify, possiblyAsyncStringify } from '../../../utils/stringify';
import { VerbosityLevel } from '../configuration/VerbosityLevel';
import { ExecutionStatus } from '../reporter/ExecutionStatus';
import type { ExecutionTree } from '../reporter/ExecutionTree';
import type {
  RunDetails,
  RunDetailsFailureInterrupted,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
} from '../reporter/RunDetails';

const safeObjectAssign = Object.assign;

/** @internal */
function formatHints(hints: string[]): string {
  if (hints.length === 1) {
    return `Hint: ${hints[0]}`;
  }
  return hints.map((h, idx) => `Hint (${idx + 1}): ${h}`).join('\n');
}

/** @internal */
function formatFailures<Ts>(failures: Ts[], stringifyOne: (value: Ts) => string): string {
  return `Encountered failures were:\n- ${failures.map(stringifyOne).join('\n- ')}`;
}

/** @internal */
function formatExecutionSummary<Ts>(executionTrees: ExecutionTree<Ts>[], stringifyOne: (value: Ts) => string): string {
  const summaryLines: string[] = [];
  const remainingTreesAndDepth: { depth: number; tree: ExecutionTree<Ts> }[] = [];
  for (const tree of executionTrees.slice().reverse()) {
    remainingTreesAndDepth.push({ depth: 1, tree });
  }
  while (remainingTreesAndDepth.length !== 0) {
    // There is at least one item to pop (remainingTreesAndDepth.length !== 0)
    // And this item is of type: { depth: number; tree: ExecutionTree<Ts> } (not nullable so `!` is safe)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentTreeAndDepth = remainingTreesAndDepth.pop()!;

    // format current tree according to its depth
    const currentTree = currentTreeAndDepth.tree;
    const currentDepth = currentTreeAndDepth.depth;
    const statusIcon =
      currentTree.status === ExecutionStatus.Success
        ? '\x1b[32m\u221A\x1b[0m'
        : currentTree.status === ExecutionStatus.Failure
          ? '\x1b[31m\xD7\x1b[0m'
          : '\x1b[33m!\x1b[0m';
    const leftPadding = Array(currentDepth).join('. ');
    summaryLines.push(`${leftPadding}${statusIcon} ${stringifyOne(currentTree.value)}`);

    // push its children to the queue
    for (const tree of currentTree.children.slice().reverse()) {
      remainingTreesAndDepth.push({ depth: currentDepth + 1, tree });
    }
  }
  return `Execution summary:\n${summaryLines.join('\n')}`;
}

/** @internal */
function preFormatTooManySkipped<Ts>(out: RunDetailsFailureTooManySkips<Ts>, stringifyOne: (value: Ts) => string) {
  const message = `Failed to run property, too many pre-condition failures encountered\n{ seed: ${out.seed} }\n\nRan ${out.numRuns} time(s)\nSkipped ${out.numSkips} time(s)`;
  let details: string | null = null;
  const hints = [
    'Try to reduce the number of rejected values by combining map, flatMap and built-in arbitraries',
    'Increase failure tolerance by setting maxSkipsPerRun to an higher value',
  ];

  if (out.verbose >= VerbosityLevel.VeryVerbose) {
    details = formatExecutionSummary(out.executionSummary, stringifyOne);
  } else {
    safePush(
      hints,
      'Enable verbose mode at level VeryVerbose in order to check all generated values and their associated status',
    );
  }

  return { message, details, hints };
}

/** @internal */
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
      return safeErrorToString(errorInstance);
    } catch (_err) {
      // no-op
    }
  }

  // Third fallback: Object::toString()
  if (errorInstance !== null && typeof errorInstance === 'object') {
    try {
      return safeToString(errorInstance);
    } catch (_err) {
      // no-op
    }
  }

  // Final fallback: Hardcoded string
  return 'Failed to serialize errorInstance';
}

/** @internal */
function preFormatFailure<Ts>(out: RunDetailsFailureProperty<Ts>, stringifyOne: (value: Ts) => string) {
  const noErrorInMessage = out.runConfiguration.errorWithCause;
  const messageErrorPart = noErrorInMessage
    ? ''
    : `\nGot ${safeReplace(prettyError(out.errorInstance), /^Error: /, 'error: ')}`;
  const message = `Property failed after ${out.numRuns} tests\n{ seed: ${out.seed}, path: "${
    out.counterexamplePath
  }", endOnFailure: true }\nCounterexample: ${stringifyOne(out.counterexample)}\nShrunk ${
    out.numShrinks
  } time(s)${messageErrorPart}`;
  let details: string | null = null;
  const hints: string[] = [];

  if (out.verbose >= VerbosityLevel.VeryVerbose) {
    details = formatExecutionSummary(out.executionSummary, stringifyOne);
  } else if (out.verbose === VerbosityLevel.Verbose) {
    details = formatFailures(out.failures, stringifyOne);
  } else {
    safePush(hints, 'Enable verbose mode in order to have the list of all failing values encountered during the run');
  }

  return { message, details, hints };
}

/** @internal */
function preFormatEarlyInterrupted<Ts>(out: RunDetailsFailureInterrupted<Ts>, stringifyOne: (value: Ts) => string) {
  const message = `Property interrupted after ${out.numRuns} tests\n{ seed: ${out.seed} }`;
  let details: string | null = null;
  const hints: string[] = [];

  if (out.verbose >= VerbosityLevel.VeryVerbose) {
    details = formatExecutionSummary(out.executionSummary, stringifyOne);
  } else {
    safePush(
      hints,
      'Enable verbose mode at level VeryVerbose in order to check all generated values and their associated status',
    );
  }

  return { message, details, hints };
}

/** @internal */
function defaultReportMessageInternal<Ts>(
  out: RunDetails<Ts>,
  stringifyOne: (value: Ts) => string,
): string | undefined {
  if (!out.failed) return;

  const { message, details, hints } =
    out.counterexamplePath === null
      ? out.interrupted
        ? preFormatEarlyInterrupted(out, stringifyOne)
        : preFormatTooManySkipped(out, stringifyOne)
      : preFormatFailure(out, stringifyOne);

  let errorMessage = message;
  if (details != null) errorMessage += `\n\n${details}`;
  if (hints.length > 0) errorMessage += `\n\n${formatHints(hints)}`;
  return errorMessage;
}

/**
 * Format output of {@link check} using the default error reporting of {@link assert}
 *
 * Produce a string containing the formated error in case of failed run,
 * undefined otherwise.
 *
 * @remarks Since 1.25.0
 * @public
 */
function defaultReportMessage<Ts>(out: RunDetails<Ts> & { failed: false }): undefined;
/**
 * Format output of {@link check} using the default error reporting of {@link assert}
 *
 * Produce a string containing the formated error in case of failed run,
 * undefined otherwise.
 *
 * @remarks Since 1.25.0
 * @public
 */
function defaultReportMessage<Ts>(out: RunDetails<Ts> & { failed: true }): string;
/**
 * Format output of {@link check} using the default error reporting of {@link assert}
 *
 * Produce a string containing the formated error in case of failed run,
 * undefined otherwise.
 *
 * @remarks Since 1.25.0
 * @public
 */
function defaultReportMessage<Ts>(out: RunDetails<Ts>): string | undefined;
function defaultReportMessage<Ts>(out: RunDetails<Ts>): string | undefined {
  return defaultReportMessageInternal(out, stringify);
}

/**
 * Format output of {@link check} using the default error reporting of {@link assert}
 *
 * Produce a string containing the formated error in case of failed run,
 * undefined otherwise.
 *
 * @remarks Since 2.17.0
 * @public
 */
function asyncDefaultReportMessage<Ts>(out: RunDetails<Ts> & { failed: false }): Promise<undefined>;
/**
 * Format output of {@link check} using the default error reporting of {@link assert}
 *
 * Produce a string containing the formated error in case of failed run,
 * undefined otherwise.
 *
 * @remarks Since 2.17.0
 * @public
 */
function asyncDefaultReportMessage<Ts>(out: RunDetails<Ts> & { failed: true }): Promise<string>;
/**
 * Format output of {@link check} using the default error reporting of {@link assert}
 *
 * Produce a string containing the formated error in case of failed run,
 * undefined otherwise.
 *
 * @remarks Since 2.17.0
 * @public
 */
function asyncDefaultReportMessage<Ts>(out: RunDetails<Ts>): Promise<string | undefined>;
async function asyncDefaultReportMessage<Ts>(out: RunDetails<Ts>): Promise<string | undefined> {
  // The asynchronous version might require two passes:
  // - the first one will register the asynchronous values that will need to be stringified
  // - the second one will take the computed values
  const pendingStringifieds: Promise<[unknown, string]>[] = [];
  function stringifyOne(value: unknown): string {
    const stringified = possiblyAsyncStringify(value);
    if (typeof stringified === 'string') {
      return stringified;
    }
    pendingStringifieds.push(Promise.all([value, stringified]));
    return '\u2026'; // ellipsis
  }
  const firstTryMessage = defaultReportMessageInternal(out, stringifyOne);

  // Checks if async mode would have changed the message
  if (pendingStringifieds.length === 0) {
    // No asynchronous stringify have been queued: the computation was synchronous
    return firstTryMessage;
  }

  // Retry with async stringified versions in mind
  const registeredValues = new Map(await Promise.all(pendingStringifieds));
  function stringifySecond(value: unknown): string {
    const asyncStringifiedIfRegistered = registeredValues.get(value);
    if (asyncStringifiedIfRegistered !== undefined) {
      return asyncStringifiedIfRegistered;
    }
    // Here we ALWAYS recompute sync versions to avoid putting a cost penalty
    // on usual paths, the ones not having any async generated values
    return stringify(value);
  }
  return defaultReportMessageInternal(out, stringifySecond);
}

/** @internal */
function buildError<Ts>(errorMessage: string | undefined, out: RunDetails<Ts> & { failed: true }) {
  if (!out.runConfiguration.errorWithCause) {
    throw new Error(errorMessage);
  }
  const ErrorWithCause: new (message: string | undefined, options: { cause: unknown }) => Error = Error;
  const error = new ErrorWithCause(errorMessage, { cause: out.errorInstance });
  if (!('cause' in error)) {
    safeObjectAssign(error, { cause: out.errorInstance });
  }
  return error;
}

/** @internal */
function throwIfFailed<Ts>(out: RunDetails<Ts>): void {
  if (!out.failed) return;
  throw buildError<Ts>(defaultReportMessage(out), out);
}

/** @internal */
async function asyncThrowIfFailed<Ts>(out: RunDetails<Ts>): Promise<void> {
  if (!out.failed) return;
  throw buildError<Ts>(await asyncDefaultReportMessage(out), out);
}

/**
 * In case this code has to be executed synchronously the caller
 * has to make sure that no asyncReporter has been defined
 * otherwise it might trigger an unchecked promise
 * @internal
 */
export function reportRunDetails<Ts>(out: RunDetails<Ts>): Promise<void> | void {
  if (out.runConfiguration.asyncReporter) return out.runConfiguration.asyncReporter(out);
  else if (out.runConfiguration.reporter) return out.runConfiguration.reporter(out);
  else return throwIfFailed(out);
}

/**
 * In case this code has to be executed synchronously the caller
 * has to make sure that no asyncReporter has been defined
 * otherwise it might trigger an unchecked promise
 * @internal
 */
export async function asyncReportRunDetails<Ts>(out: RunDetails<Ts>): Promise<void> {
  if (out.runConfiguration.asyncReporter) return out.runConfiguration.asyncReporter(out);
  else if (out.runConfiguration.reporter) return out.runConfiguration.reporter(out);
  else return asyncThrowIfFailed(out);
}

export { defaultReportMessage, asyncDefaultReportMessage };
