import { stringify, possiblyAsyncStringify } from '../../../utils/stringify.js';
import { VerbosityLevel } from '../configuration/VerbosityLevel.js';
import { ExecutionStatus } from '../reporter/ExecutionStatus.js';
import type { ExecutionTree } from '../reporter/ExecutionTree.js';
import type {
  RunDetails,
  RunDetailsFailureInterrupted,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
  RunDetailsSuccess,
} from '../reporter/RunDetails.js';

type FormatStringifier = (value: unknown) => string;
type FormatOutput = {
  /** Main error message describing the failure. Enriched with extra details depending on the verbosity level */
  message: string;
  /** Hints displayed regardless of the verbosity level. Default hints might be appended */
  hints?: string[];
};

type FullFormatOutput = {
  /** Main error message */
  message: string;
  /** Execution details */
  details: string | undefined;
  /** Report hints, including defaults */
  hints: string[];
};

function formatHints(hints: string[]): string {
  if (hints.length === 1) {
    return `Hint: ${hints[0]}`;
  }
  return hints.map((h, idx) => `Hint (${idx + 1}): ${h}`).join('\n');
}

function buildErrorMessage(formatted: FullFormatOutput): string {
  let errorMessage = formatted.message;
  if (formatted.details !== null) errorMessage += `\n\n${formatted.details}`;
  if (formatted.hints.length > 0) errorMessage += `\n\n${formatHints(formatted.hints)}`;
  return errorMessage;
}

function formatFailures<Ts>(failures: Ts[], stringifyOne: (value: Ts) => string): string {
  if (failures.length === 0) {
    return `No failure encountered`;
  }
  return `Encountered failures were:\n- ${failures.map(stringifyOne).join('\n- ')}`;
}

function formatExecutionSummary<Ts>(executionTrees: ExecutionTree<Ts>[], stringifyOne: (value: Ts) => string): string {
  const summaryLines: string[] = [];
  const remainingTreesAndDepth: { depth: number; tree: ExecutionTree<Ts> }[] = [];
  for (let i = executionTrees.length - 1; i >= 0; --i) {
    remainingTreesAndDepth.push({ depth: 1, tree: executionTrees[i] });
  }
  while (remainingTreesAndDepth.length !== 0) {
    // There is at least one item to pop (remainingTreesAndDepth.length !== 0)
    // And this item is of type: { depth: number; tree: ExecutionTree<Ts> } (not nullable so `!` is safe)
    // oxlint-disable-next-line typescript/no-non-null-assertion
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
    const leftPadding = currentDepth !== 0 ? '. '.repeat(currentDepth - 1) : '';
    summaryLines.push(`${leftPadding}${statusIcon} ${stringifyOne(currentTree.value)}`);

    // push its children to the queue
    for (let i = currentTree.children.length - 1; i >= 0; --i) {
      remainingTreesAndDepth.push({ depth: currentDepth + 1, tree: currentTree.children[i] });
    }
  }
  return `Execution summary:\n${summaryLines.join('\n')}`;
}

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

function preFormatEarlyInterrupted<Ts>(out: RunDetailsFailureInterrupted<Ts>) {
  const message = `Property interrupted after ${out.numRuns} tests\n{ seed: ${out.seed} }`;
  return { message };
}

function defaultReportMessageInternal<Ts>(
  out: RunDetailsFailureProperty<Ts> | RunDetailsFailureTooManySkips<Ts> | RunDetailsFailureInterrupted<Ts>,
  stringifyOne: (value: Ts) => string,
): FormatOutput {
  return out.counterexamplePath === null
    ? out.interrupted
      ? preFormatEarlyInterrupted(out)
      : preFormatTooManySkipped(out)
    : preFormatFailure(out, stringifyOne);
}

function enrichFormatOutput<Ts>(
  out: RunDetails<Ts>,
  formatted: FormatOutput,
  stringifyOne: FormatStringifier,
): FullFormatOutput {
  const { message, hints = [] } = formatted;
  return {
    message: message,
    details:
      out.verbose >= VerbosityLevel.VeryVerbose
        ? formatExecutionSummary(out.executionSummary, stringifyOne)
        : out.verbose === VerbosityLevel.Verbose
          ? formatFailures(out.failures, stringifyOne)
          : undefined,
    hints:
      out.verbose >= VerbosityLevel.VeryVerbose
        ? hints
        : [...hints, 'Increase the verbosity level to see more details about the run'],
  };
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
function defaultReportMessage<Ts>(
  out: RunDetailsFailureProperty<Ts> | RunDetailsFailureTooManySkips<Ts> | RunDetailsFailureInterrupted<Ts>,
): Promise<string> | string;
/**
 * Format output of {@link check} using the default error reporting of {@link assert}
 *
 * Produce a string containing the formated error in case of failed run,
 * undefined otherwise.
 *
 * @remarks Since 1.25.0
 * @public
 */
function defaultReportMessage<Ts>(out: RunDetailsSuccess<Ts>): Promise<undefined> | undefined;
/**
 * Format output of {@link check} using the default error reporting of {@link assert}
 *
 * Produce a string containing the formated error in case of failed run,
 * undefined otherwise.
 *
 * @remarks Since 1.25.0
 * @public
 */
function defaultReportMessage<Ts>(out: RunDetails<Ts>): Promise<string | undefined> | string | undefined;
function defaultReportMessage<Ts>(out: RunDetails<Ts>): Promise<string | undefined> | string | undefined {
  if (!out.failed) {
    return;
  }
  return buildReportedErrorInternal(
    (stringifier) => enrichFormatOutput(out, defaultReportMessageInternal(out, stringifier), stringifier),
    (message) => message,
  );
}

function buildReportedErrorInternal<TOut>(
  fullFormat: (stringifyValue: FormatStringifier) => FullFormatOutput,
  wrapOutput: (output: string) => TOut,
): Promise<TOut> | TOut {
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
  const firstTryFormatted = fullFormat(stringifyOne);

  // Checks if async mode would have changed the message
  if (pendingStringifieds.length === 0) {
    // No asynchronous stringify have been queued: the computation was synchronous
    return wrapOutput(buildErrorMessage(firstTryFormatted));
  }

  // Retry with async stringified versions in mind
  return Promise.all(pendingStringifieds).then((rawRegisteredValues) => {
    const registeredValues = new Map(rawRegisteredValues);
    function stringifySecond(value: unknown): string {
      const asyncStringifiedIfRegistered = registeredValues.get(value);
      if (asyncStringifiedIfRegistered !== undefined) {
        return asyncStringifiedIfRegistered;
      }
      // Here we ALWAYS recompute sync versions to avoid putting a cost penalty
      // on usual paths, the ones not having any async generated values
      return stringify(value);
    }
    return wrapOutput(buildErrorMessage(fullFormat(stringifySecond)));
  });
}

function buildError<Ts>(errorMessage: string | undefined, out: RunDetails<Ts>) {
  if (out.runConfiguration.includeErrorInReport) {
    throw new Error(errorMessage);
  }
  return new Error(errorMessage, { cause: out.errorInstance });
}

export function reportError<Ts>(
  format: (stringifyValue: FormatStringifier) => FormatOutput,
  out: RunDetails<Ts>,
): Promise<never> | never {
  return buildReportedErrorInternal(
    (stringifier) => enrichFormatOutput(out, format(stringifier), stringifier),
    (message) => {
      throw buildError<Ts>(message, out);
    },
  );
}

export function reportRunDetails<Ts>(out: RunDetails<Ts>): Promise<void> | void {
  if (!out.failed) {
    return;
  }
  return buildReportedErrorInternal(
    (stringifier) => enrichFormatOutput(out, defaultReportMessageInternal(out, stringifier), stringifier),
    (message) => {
      throw buildError<Ts>(message, out);
    },
  );
}

export { defaultReportMessage };
