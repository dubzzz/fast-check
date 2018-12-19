import { VerbosityLevel } from '../configuration/VerbosityLevel';
import { RunDetails } from './RunDetails';

/**
 * @hidden
 *
 * Report the status of a run
 *
 * It receives notification from the runner in case of failures
 */
export class RunExecution<Ts> {
  pathToFailure?: string;
  value?: Ts;
  failure: string;
  allFailures: Ts[];
  numSkips: number;
  numSuccesses: number;

  constructor(readonly verbosity: VerbosityLevel) {
    this.allFailures = [];
    this.numSkips = 0;
    this.numSuccesses = 0;
  }

  fail(value: Ts, id: number, message: string) {
    if (this.verbosity >= VerbosityLevel.Verbose) this.allFailures.push(value);
    if (this.pathToFailure == null) this.pathToFailure = `${id}`;
    else this.pathToFailure += `:${id}`;
    this.value = value;
    this.failure = message;
  }
  skip() {
    if (this.pathToFailure == null) {
      ++this.numSkips;
    }
  }
  success() {
    if (this.pathToFailure == null) {
      ++this.numSuccesses;
    }
  }

  private isSuccess = (): boolean => this.pathToFailure == null;
  private firstFailure = (): number => (this.pathToFailure ? +this.pathToFailure.split(':')[0] : -1);
  private numShrinks = (): number => (this.pathToFailure ? this.pathToFailure.split(':').length - 1 : 0);

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
        numRuns: this.firstFailure() + 1 - this.numSkips,
        numSkips: this.numSkips,
        numShrinks: this.numShrinks(),
        seed,
        counterexample: this.value!,
        counterexamplePath: RunExecution.mergePaths(basePath, this.pathToFailure!),
        error: this.failure,
        failures: this.allFailures
      };
    }
    if (this.numSkips > maxSkips) {
      // too many skips
      return {
        failed: true,
        numRuns: this.numSuccesses,
        numSkips: this.numSkips,
        numShrinks: 0,
        seed,
        counterexample: null,
        counterexamplePath: null,
        error: null,
        failures: []
      };
    }
    return {
      failed: false,
      numRuns,
      numSkips: this.numSkips,
      numShrinks: 0,
      seed,
      counterexample: null,
      counterexamplePath: null,
      error: null,
      failures: []
    };
  }
}
