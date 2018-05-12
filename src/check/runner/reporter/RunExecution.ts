import { QualifiedParameters } from '../configuration/QualifiedParameters';
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

  fail(value: Ts, id: number, message: string) {
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

  toRunDetails(qParams: QualifiedParameters): RunDetails<Ts> {
    return this.isSuccess()
      ? {
          failed: false,
          numRuns: qParams.numRuns,
          numShrinks: 0,
          seed: qParams.seed,
          counterexample: null,
          counterexamplePath: null,
          error: null
        }
      : {
          failed: true,
          numRuns: this.firstFailure() + 1,
          numShrinks: this.numShrinks(),
          seed: qParams.seed,
          counterexample: this.value!,
          counterexamplePath: RunExecution.mergePaths(qParams.path, this.pathToFailure!),
          error: this.failure
        };
  }
}
