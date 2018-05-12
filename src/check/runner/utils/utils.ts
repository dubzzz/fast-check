import { QualifiedParameters } from '../configuration/QualifiedParameters';

/**
 * Post-run details produced by {@link check}
 *
 * A failing property can easily detected by checking the `failed` flag of this structure
 */
interface RunDetails<Ts> {
  /**
   * Does the property failed during the execution of {@link check}?
   */
  failed: boolean;
  /**
   * Number of runs
   *
   * - In case of failed property: Number of runs up to the first failure (including the failure run)
   * - Otherwise: Number of successful executions
   */
  numRuns: number;
  /**
   * Number of shrinks required to get to the minimal failing case (aka counterexample)
   */
  numShrinks: number;
  /**
   * Seed that have been used by the run
   *
   * It can be forced in {@link assert}, {@link check}, {@link sample} and {@link statistics} using {@link Parameters}
   */
  seed: number;
  /**
   * In case of failure: the counterexample contains the minimal failing case (first failure after shrinking)
   */
  counterexample: Ts | null;
  /**
   * In case of failure: it contains the reason of the failure
   */
  error: string | null;
  /**
   * In case of failure: path to the counterexample
   *
   * For replay purposes, it can be forced in {@link assert}, {@link check}, {@link sample} and {@link statistics} using {@link Parameters}
   */
  counterexamplePath: string | null;
}

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

/** @hidden */
class RunExecution<Ts> {
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

/** @hidden */
function prettyOne<Ts>(value: Ts): string {
  if (typeof value === 'string') return JSON.stringify(value);

  const defaultRepr: string = `${value}`;
  if (/^\[object (Object|Null|Undefined)\]$/.exec(defaultRepr) === null) return defaultRepr;
  try {
    return JSON.stringify(value);
  } catch (err) {
    // ignored: object cannot be stringified using JSON.stringify
  }
  return defaultRepr;
}

/** @hidden */
function pretty<Ts>(value: Ts): string {
  if (Array.isArray(value)) return `[${[...value].map(pretty).join(',')}]`;
  return prettyOne(value);
}

/** @hidden */
function throwIfFailed<Ts>(out: RunDetails<Ts>) {
  if (out.failed) {
    throw new Error(
      `Property failed after ${out.numRuns} tests (seed: ${out.seed}, path: ${out.counterexamplePath}): ${pretty(
        out.counterexample
      )}
Shrunk ${out.numShrinks} time(s)
Got error: ${out.error}`
    );
  }
}

export { RunDetails, RunExecution, throwIfFailed };
