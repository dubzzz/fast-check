import { VerbosityLevel } from '../configuration/VerbosityLevel.js';
import { ExecutionStatus } from './ExecutionStatus.js';
import type { ExecutionTree } from './ExecutionTree.js';
import type {
  RunDetails,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
  RunDetailsSuccess,
} from './RunDetails.js';
import type { QualifiedParameters } from '../configuration/QualifiedParameters.js';
import type { PropertyFailure } from '../../property/types/PropertyFailure.js';

/**
 * Report the status of a run
 *
 * It receives notification from the runner in case of failures
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
    readonly maxSkips: number,
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
    if (this.pathToFailure === undefined) this.pathToFailure = `${id}`;
    else this.pathToFailure += `:${id}`;
    this.value = value;
    this.failure = failure;
  }
  skip(value: Ts): void {
    if (this.verbosity >= VerbosityLevel.VeryVerbose) {
      this.appendExecutionTree(ExecutionStatus.Skipped, value);
    }
    if (this.pathToFailure === undefined) {
      ++this.numSkips;
      if (this.numSkips > this.maxSkips) {
        this.interrupted = true;
      }
    }
  }
  success(value: Ts): void {
    if (this.verbosity >= VerbosityLevel.VeryVerbose) {
      this.appendExecutionTree(ExecutionStatus.Success, value);
    }
    if (this.pathToFailure === undefined) {
      ++this.numSuccesses;
    }
  }
  interrupt(): void {
    this.interrupted = true;
  }

  private isSuccess(): boolean {
    return this.pathToFailure === undefined;
  }

  private firstFailure(): number {
    return this.pathToFailure !== undefined ? +this.pathToFailure.split(':')[0] : -1;
  }

  private numShrinks(): number {
    return this.pathToFailure !== undefined ? this.pathToFailure.split(':').length - 1 : 0;
  }

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

  private static mergePaths(offsetPath: string, path: string): string {
    if (offsetPath.length === 0) return path;
    const offsetItems = offsetPath.split(':');
    const remainingItems = path.split(':');
    const middle = +offsetItems[offsetItems.length - 1] + +remainingItems[0];
    return [...offsetItems.slice(0, offsetItems.length - 1), `${middle}`, ...remainingItems.slice(1)].join(':');
  }

  toRunDetails(seed: number, basePath: string, qParams: QualifiedParameters<Ts>): RunDetails<Ts> {
    if (!this.isSuccess()) {
      // encountered a property failure
      return {
        failed: true,
        interrupted: this.interrupted,
        numRuns: this.firstFailure() + 1 - this.numSkips,
        numSkips: this.numSkips,
        numShrinks: this.numShrinks(),
        seed,
        // Rq: isSuccess() true <=> this.pathToFailure === undefined
        //     The only path assigning a value to this.pathToFailure is fail
        //     At the same time it also assigns a non-null value to this.value
        //     And this is the only path assigning a value to this.value
        // =>  this.value !== undefined
        // oxlint-disable-next-line typescript/no-non-null-assertion
        counterexample: this.value!,
        // See isSuccess: true <=> this.pathToFailure === undefined
        // oxlint-disable-next-line typescript/no-non-null-assertion
        counterexamplePath: RunExecution.mergePaths(basePath, this.pathToFailure!),
        // Rq: Same as this.value
        // =>  this.failure !== undefined
        // oxlint-disable-next-line typescript/no-non-null-assertion
        errorInstance: this.failure!.error,
        failures: this.extractFailures(),
        executionSummary: this.rootExecutionTrees,
        verbose: this.verbosity,
        runConfiguration: qParams.toParameters(),
      } satisfies RunDetailsFailureProperty<Ts>;
    }

    if (this.interrupted && this.numSkips > this.maxSkips) {
      return {
        failed: true,
        interrupted: this.interrupted,
        numRuns: this.numSuccesses,
        numSkips: this.numSkips,
        numShrinks: 0,
        seed,
        counterexample: null,
        counterexamplePath: null,
        errorInstance: null,
        failures: [],
        executionSummary: this.rootExecutionTrees,
        verbose: this.verbosity,
        runConfiguration: qParams.toParameters(),
      } satisfies RunDetailsFailureTooManySkips<Ts>;
    }

    return {
      failed: false,
      interrupted: this.interrupted,
      numRuns: this.numSuccesses,
      numSkips: this.numSkips,
      numShrinks: 0,
      seed,
      counterexample: null,
      counterexamplePath: null,
      errorInstance: null,
      failures: [],
      executionSummary: this.rootExecutionTrees,
      verbose: this.verbosity,
      runConfiguration: qParams.toParameters(),
    } satisfies RunDetailsSuccess<Ts>;
  }
}
