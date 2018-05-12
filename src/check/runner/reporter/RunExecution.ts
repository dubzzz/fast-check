import { QualifiedParameters } from '../configuration/QualifiedParameters';
import { RunDetails } from './RunDetails';

/** @hidden */
function successFor<Ts>(qParams: QualifiedParameters): RunDetails<Ts> {
  return {
    failed: false,
    numRuns: qParams.numRuns,
    numShrinks: 0,
    seed: qParams.seed,
    counterexample: null,
    counterexamplePath: null,
    error: null
  };
}

/** @hidden */
function failureFor<Ts>(
  qParams: QualifiedParameters,
  numRuns: number,
  numShrinks: number,
  counterexample: Ts,
  counterexamplePath: string,
  error: string
): RunDetails<Ts> {
  return {
    failed: true,
    numRuns,
    numShrinks,
    seed: qParams.seed,
    counterexample,
    counterexamplePath,
    error
  };
}

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

  toRunDetails(qParams: QualifiedParameters): RunDetails<Ts> {
    const mergePaths = (offsetPath: string, path: string) => {
      if (offsetPath.length === 0) return path;
      const offsetItems = offsetPath.split(':');
      const remainingItems = path.split(':');
      const middle = +offsetItems[offsetItems.length - 1] + +remainingItems[0];
      return [...offsetItems.slice(0, offsetItems.length - 1), `${middle}`, ...remainingItems.slice(1)].join(':');
    };
    return this.isSuccess()
      ? successFor<Ts>(qParams)
      : failureFor<Ts>(
          qParams,
          this.firstFailure() + 1,
          this.numShrinks(),
          this.value!,
          mergePaths(qParams.path, this.pathToFailure!),
          this.failure
        );
  }
}
