import { VerbosityLevel } from '../configuration/VerbosityLevel';
import { ExecutionStatus } from './ExecutionStatus';
import type { ExecutionTree } from './ExecutionTree';
import type { RunDetails } from './RunDetails';
import type { QualifiedParameters } from '../configuration/QualifiedParameters';
import type { PropertyFailure } from '../../property/IRawProperty';
import { safeSplit } from '../../../utils/globals';

/**
 * Report the status of a run
 *
 * It receives notification from the runner in case of failures
 *
 * @internal
 */
export class RunExecution<Ts> {
  readonly rootExecutionTrees: ExecutionTree<Ts>[];
  currentLevelExecutionTrees: ExecutionTree<Ts>[];
  pathToFailure?: string;
  value?: Ts;
  failure: PropertyFailure | null;
  numSkips: number;
  numSuccesses: number;
  interrupted: boolean;

  constructor(
    readonly verbosity: VerbosityLevel,
    readonly interruptedAsFailure: boolean,
  ) {
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

  fail(value: Ts, id: number, failure: PropertyFailure): void {
    if (this.verbosity >= VerbosityLevel.Verbose) {
      const currentTree = this.appendExecutionTree(ExecutionStatus.Failure, value);
      this.currentLevelExecutionTrees = currentTree.children;
    }
    if (this.pathToFailure == null) this.pathToFailure = `${id}`;
    else this.pathToFailure += `:${id}`;
    this.value = value;
    this.failure = failure;
  }
  skip(value: Ts): void {
    if (this.verbosity >= VerbosityLevel.VeryVerbose) {
      this.appendExecutionTree(ExecutionStatus.Skipped, value);
    }
    if (this.pathToFailure == null) {
      ++this.numSkips;
    }
  }
  success(value: Ts): void {
    if (this.verbosity >= VerbosityLevel.VeryVerbose) {
      this.appendExecutionTree(ExecutionStatus.Success, value);
    }
    if (this.pathToFailure == null) {
      ++this.numSuccesses;
    }
  }
  interrupt(): void {
    this.interrupted = true;
  }

  private isSuccess = (): boolean => this.pathToFailure == null;
  private firstFailure = (): number => (this.pathToFailure ? +safeSplit(this.pathToFailure, ':')[0] : -1);
  private numShrinks = (): number => (this.pathToFailure ? safeSplit(this.pathToFailure, ':').length - 1 : 0);

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

  toRunDetails(seed: number, basePath: string, maxSkips: number, qParams: QualifiedParameters<Ts>): RunDetails<Ts> {
    if (!this.isSuccess()) {
      // encountered a property failure
      return {
        failed: true,
        interrupted: this.interrupted,
        numRuns: this.firstFailure() + 1 - this.numSkips,
        numSkips: this.numSkips,
        numShrinks: this.numShrinks(),
        seed,
        // Rq: isSuccess() true <=> this.pathToFailure == null
        //     The only path assigning a value to this.pathToFailure is fail
        //     At the same time it also assigns a non-null value to this.value
        //     And this is the only path assigning a value to this.value
        // =>  this.value !== undefined
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        counterexample: this.value!,
        // See isSuccess: true <=> this.pathToFailure == null
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        counterexamplePath: RunExecution.mergePaths(basePath, this.pathToFailure!),
        // Rq: Same as this.value
        // =>  this.failure !== undefined
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        errorInstance: this.failure!.error,
        failures: this.extractFailures(),
        executionSummary: this.rootExecutionTrees,
        verbose: this.verbosity,
        runConfiguration: qParams.toParameters(),
      };
    }

    // Either 'too many skips' or 'interrupted' with flag interruptedAsFailure enabled
    // The two cases are exclusive (the two cannot be true at the same time)
    const considerInterruptedAsFailure = this.interruptedAsFailure || this.numSuccesses === 0;
    const failed = this.numSkips > maxSkips || (this.interrupted && considerInterruptedAsFailure);

    // -- Let's suppose: this.numSkips > maxSkips
    // In the context of RunnerIterator we pull values from the stream
    // using the underlying SourceValuesIterator until we reach a first failure.
    // By definition this.numSkips > maxSkips means that we were not even able to generate
    // enough values to reach this point. So we never reached first failure.
    // For each of these values, we call one of: fail, skip, interrupt or success.
    // In case of skip we also notify the SourceValuesIterator for the skip.
    // SourceValuesIterator automatically ends as soon as we skip too many values
    // so no subsequent values will be pulled from it, so no call to interrupt after this last skip.
    // -- Similarly, when interrupted, RunnerIterator stops everything so no call to skip after being interrupted.
    const out = {
      failed,
      interrupted: this.interrupted,
      numRuns: this.numSuccesses,
      numSkips: this.numSkips,
      numShrinks: 0,
      seed,
      counterexample: null,
      counterexamplePath: null,
      error: null,
      errorInstance: null,
      failures: [],
      executionSummary: this.rootExecutionTrees,
      verbose: this.verbosity,
      runConfiguration: qParams.toParameters(),
    };
    return out;
  }
}
