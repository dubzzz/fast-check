import { ExecutionStatus } from './ExecutionStatus';
import type { ExecutionTree } from './ExecutionTree';
import type { RunDetails } from './RunDetails';
import { stringify } from '../../../utils/stringify';
import { getTestNameFromStackTrace } from '../utils/TestNameDetector';
import * as fs from 'fs';
import * as path from 'path';

export interface ObservedTestCase {
  type: 'test_case';
  run_start: number;
  property: string;
  status: 'passed' | 'failed' | 'gave_up';
  status_reason: string;
  representation: string;
  coverage: 'no_coverage_info'; // not supported yet
  features: Record<string, any>;
  how_generated: string;
  timing?: Record<string, number>;
}

/**
 * Convert ExecutionStatus to ObservedTestCase status
 */
function mapExecutionStatusToObservedStatus(status: ExecutionStatus): 'passed' | 'failed' | 'gave_up' {
  switch (status) {
    case ExecutionStatus.Success:
      return 'passed';
    case ExecutionStatus.Failure:
      return 'failed';
    case ExecutionStatus.Skipped:
      return 'gave_up';
    default:
      return 'failed';
  }
}

/**
 * Get status reason based on execution status and run details
 */
function getStatusReason<Ts>(status: ExecutionStatus, runDetails: RunDetails<Ts>): string {
  switch (status) {
    case ExecutionStatus.Success:
      return '';
    case ExecutionStatus.Failure:
      if (runDetails.failed && runDetails.counterexample !== null) {
        return 'Property failed with counterexample';
      }
      return 'Property failed';
    case ExecutionStatus.Skipped:
      return 'Pre-condition failed';
    default:
      return '';
  }
}

/**
 * Convert a single ExecutionTree to ObservedTestCase
 */
function executionTreeToObservedTestCase<Ts>(
  tree: ExecutionTree<Ts>,
  runDetails: RunDetails<Ts>,
  propertyName: string,
): ObservedTestCase {
  const status = mapExecutionStatusToObservedStatus(tree.status);
  const statusReason = getStatusReason(tree.status, runDetails);
  const representation = stringify(tree.value);

  return {
    type: 'test_case',
    run_start: runDetails.runStart,
    property: propertyName,
    status,
    status_reason: statusReason,
    representation,
    features: {},
    coverage: 'no_coverage_info',
    how_generated: 'fast-check',
  };
}

/**
 * Convert all ExecutionTrees from RunDetails to ObservedTestCases
 */
export function convertExecutionTreesToObservedTestCases<Ts>(
  runDetails: RunDetails<Ts>,
  propertyName: string,
): ObservedTestCase[] {
  const observedTestCases: ObservedTestCase[] = [];

  // Convert each execution tree to an observed test case
  for (const tree of runDetails.executionSummary) {
    const observedTestCase = executionTreeToObservedTestCase(tree, runDetails, propertyName);
    observedTestCases.push(observedTestCase);

    // Recursively convert children if needed
    function convertChildren(parentTree: ExecutionTree<Ts>) {
      for (const childTree of parentTree.children) {
        const childObservedTestCase = executionTreeToObservedTestCase(childTree, runDetails, propertyName);
        observedTestCases.push(childObservedTestCase);

        // Recursively process grandchildren
        if (childTree.children.length > 0) {
          convertChildren(childTree);
        }
      }
    }

    convertChildren(tree);
  }

  return observedTestCases;
}

/**
 * Convert all ExecutionTrees from RunDetails to ObservedTestCases with automatic test name detection
 */
export function convertExecutionTreesToObservedTestCasesWithTestName<Ts>(
  runDetails: RunDetails<Ts>,
): ObservedTestCase[] {
  const testName = runDetails.runConfiguration.testCaseName || getTestNameFromStackTrace();
  return convertExecutionTreesToObservedTestCases(runDetails, testName);
}

/**
 * Get the date string in YYYY-MM-DD format from a timestamp
 */
function getDateStringFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Ensure the observer directory exists
 */
function ensureObserverDirectory(): string {
  const cwd = process.cwd();
  const observerDir = path.join(cwd, '.fast-check', 'observer');

  if (!fs.existsSync(observerDir)) {
    fs.mkdirSync(observerDir, { recursive: true });
  }

  return observerDir;
}

/**
 * Write test cases to JSONL file
 */
function writeTestCasesToFile(observedTestCases: ObservedTestCase[], runStart: number): void {
  try {
    const observerDir = ensureObserverDirectory();
    const dateString = getDateStringFromTimestamp(runStart);
    const filename = `${dateString}_test_cases.jsonl`;
    const filepath = path.join(observerDir, filename);

    // Convert each test case to a JSON line
    const jsonLines = observedTestCases.map((testCase) => JSON.stringify(testCase)).join('\n');

    // Append to file (create if doesn't exist)
    if (jsonLines.length > 0) {
      const content = fs.existsSync(filepath) ? '\n' + jsonLines : jsonLines;
      fs.appendFileSync(filepath, content, 'utf8');
    }
  } catch (error) {
    // Silently fail to avoid breaking tests if file writing fails
    console.warn('Failed to write test cases to file:', error);
  }
}

export function observe<Ts>(out: RunDetails<Ts>): RunDetails<Ts> {
  if (out.runConfiguration.observabilityEnabled) {
    const observedTestCases = convertExecutionTreesToObservedTestCasesWithTestName(out);

    // Write test cases to JSONL file using the run start timestamp
    writeTestCasesToFile(observedTestCases, out.runStart);
  }
  return out;
}
