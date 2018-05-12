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

  constructor(readonly storeFailures: boolean) {
    this.allFailures = [];
  }

  fail(value: Ts, id: number, message: string) {
    if (this.storeFailures) this.allFailures.push(value);
    if (this.pathToFailure == null) this.pathToFailure = `${id}`;
    else this.pathToFailure += `:${id}`;
    this.value = value;
    this.failure = message;
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

  toRunDetails(seed: number, basePath: string, numRuns: number): RunDetails<Ts> {
    return this.isSuccess()
      ? {
          failed: false,
          numRuns,
          numShrinks: 0,
          seed,
          counterexample: null,
          counterexamplePath: null,
          error: null,
          failures: []
        }
      : {
          failed: true,
          numRuns: this.firstFailure() + 1,
          numShrinks: this.numShrinks(),
          seed,
          counterexample: this.value!,
          counterexamplePath: RunExecution.mergePaths(basePath, this.pathToFailure!),
          error: this.failure,
          failures: this.allFailures
        };
  }
}
