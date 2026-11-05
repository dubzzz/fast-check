import { stringify, possiblyAsyncStringify } from '../../../utils/stringify.js';
import { VerbosityLevel } from '../configuration/VerbosityLevel.js';
import { ExecutionStatus } from '../reporter/ExecutionStatus.js';
import type { ExecutionTree } from '../reporter/ExecutionTree.js';
import type { RunDetails } from '../reporter/RunDetails.js';

type FormatStringifier = (value: unknown) => string;
type FormatOutput = {
  /** Main error message describing the failure. Enriched with extra details depending on the verbosity level */
  message: string;
  /** Hints displayed regardless of the verbosity level. Default hints might be appended */
  hints?: string[];
};

type ReportContent = {
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

function formatReportContent(formatted: ReportContent): string {
  let errorMessage = formatted.message;
  if (formatted.details !== undefined) errorMessage += `\n\n${formatted.details}`;
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

function buildReportContent<Ts>(
  out: RunDetails<Ts>,
  formatted: FormatOutput,
  stringifyOne: FormatStringifier,
): ReportContent {
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

function buildErrorMessageInternal(
  buildContent: (stringifyValue: FormatStringifier) => ReportContent,
): Promise<string> | string {
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
  const initialContent = buildContent(stringifyOne);

  // Checks if async mode would have changed the message
  if (pendingStringifieds.length === 0) {
    // No asynchronous stringify have been queued: the computation was synchronous
    return formatReportContent(initialContent);
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
    return formatReportContent(buildContent(stringifySecond));
  });
}

export function buildErrorMessage<Ts>(
  format: (stringifyValue: FormatStringifier) => FormatOutput,
  out: RunDetails<Ts>,
): Promise<string> | string {
  return buildErrorMessageInternal((stringifier) => buildReportContent(out, format(stringifier), stringifier));
}
