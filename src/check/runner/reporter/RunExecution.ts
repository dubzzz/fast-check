import { VerbosityLevel } from '../configuration/VerbosityLevel';
import { ExecutionStatus } from './ExecutionStatus';
import { ExecutionTree } from './ExecutionTree';
import { RunDetails } from './RunDetails';

/**
 * @internal
 *
 * Report the status of a run
 *
 * It receives notification from the runner in case of failures
 */
export class RunExecution<Ts> {
  readonly rootExecutionTrees: ExecutionTree<Ts>[];
  currentLevelExecutionTrees: ExecutionTree<Ts>[];
  pathToFailure?: string;
  value?: Ts;
  failure: string | null;
  numSkips: number;
  numSuccesses: number;
  interrupted: boolean;

  constructor(readonly verbosity: VerbosityLevel, readonly interruptedAsFailure: boolean) {
    this.rootExecutionTrees = [];
    this.currentLevelExecutionTrees = this.rootExecutionTrees;
    this.failure = null;
    this.numSkips = 0;
    this.numSuccesses = 0;
    this.interrupted = false;
  }

  private appendExecutionTree(status: ExecutionStatus, value: Ts) {
    const currentTree: ExecutionTree<Ts> = { status, value, children: [] };
    this.currentLevelExecutionTrees.push(currentTree);
    return currentTree;
  }

  fail(value: Ts, id: number, message: string) {
    if (this.verbosity >= VerbosityLevel.Verbose) {
      const currentTree = this.appendExecutionTree(ExecutionStatus.Failure, value);
      this.currentLevelExecutionTrees = currentTree.children;
    }
    if (this.pathToFailure == null) this.pathToFailure = `${id}`;
    else this.pathToFailure += `:${id}`;
    this.value = value;
    this.failure = message;
  }
  skip(value: Ts) {
    if (this.verbosity >= VerbosityLevel.VeryVerbose) {
      this.appendExecutionTree(ExecutionStatus.Skipped, value);
    }
    if (this.pathToFailure == null) {
      ++this.numSkips;
    }
  }
  success(value: Ts) {
    if (this.verbosity >= VerbosityLevel.VeryVerbose) {
      this.appendExecutionTree(ExecutionStatus.Success, value);
    }
    if (this.pathToFailure == null) {
      ++this.numSuccesses;
    }
  }
  interrupt() {
    this.interrupted = true;
  }

  private isSuccess = (): boolean => this.pathToFailure == null;
  private firstFailure = (): number => (this.pathToFailure ? +this.pathToFailure.split(':')[0] : -1);
  private numShrinks = (): number => (this.pathToFailure ? this.pathToFailure.split(':').length - 1 : 0);

  private extractFailures() {
    if (this.isSuccess()) {
      return [];
    }
    const failures: Ts[] = [];
    let cursor = this.rootExecutionTrees;
    while (cursor.length > 0 && cursor[cursor.length - 1].status === ExecutionStatus.Failure) {
      const failureTree = cursor[cursor.length - 1];
      failures.push(failureTree.value);
      cursor = failureTree.children;
    }
    return failures;
  }

  private static mergePaths = (offsetPath: string, path: string) => {
    if (offsetPath.length === 0) return path;
    const offsetItems = offsetPath.split(':');
    const remainingItems = path.split(':');
    const middle = +offsetItems[offsetItems.length - 1] + +remainingItems[0];
    return [...offsetItems.slice(0, offsetItems.length - 1), `${middle}`, ...remainingItems.slice(1)].join(':');
  };

  toRunDetails(seed: number, basePath: string, numRuns: number, maxSkips: number): RunDetails<Ts> {
    if (!this.isSuccess()) {
      // encountered a property failure
      return {
        failed: true,
        interrupted: this.interrupted,
        numRuns: this.firstFailure() + 1 - this.numSkips,
        numSkips: this.numSkips,
        numShrinks: this.numShrinks(),
        seed,
        counterexample: this.value!,
        counterexamplePath: RunExecution.mergePaths(basePath, this.pathToFailure!),
        error: this.failure,
        failures: this.extractFailures(),
        executionSummary: this.rootExecutionTrees,
        verbose: this.verbosity
      };
    }
    if (this.numSkips > maxSkips) {
      // too many skips
      return {
        failed: true,
        interrupted: this.interrupted,
        numRuns: this.numSuccesses,
        numSkips: this.numSkips,
        numShrinks: 0,
        seed,
        counterexample: null,
        counterexamplePath: null,
        error: null,
        failures: [],
        executionSummary: this.rootExecutionTrees,
        verbose: this.verbosity
      };
    }
    return {
      failed: this.interrupted ? this.interruptedAsFailure : false,
      interrupted: this.interrupted,
      numRuns: this.numSuccesses,
      numSkips: this.numSkips,
      numShrinks: 0,
      seed,
      counterexample: null,
      counterexamplePath: null,
      error: null,
      failures: [],
      executionSummary: this.rootExecutionTrees,
      verbose: this.verbosity
    };
  }
}
