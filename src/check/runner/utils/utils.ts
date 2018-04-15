interface Parameters {
  seed?: number;
  num_runs?: number;
  timeout?: number;
  path?: string;
  logger?(v: string): void;
}
class QualifiedParameters {
  seed: number;
  num_runs: number;
  timeout: number | null;
  path: string;
  logger: (v: string) => void;

  private static readSeed = (p?: Parameters): number => (p != null && p.seed != null ? p.seed : Date.now());
  private static readNumRuns = (p?: Parameters): number => (p != null && p.num_runs != null ? p.num_runs : 100);
  private static readTimeout = (p?: Parameters): number | null => (p != null && p.timeout != null ? p.timeout : null);
  private static readPath = (p?: Parameters): string => (p != null && p.path != null ? p.path : '');
  private static readLogger = (p?: Parameters): ((v: string) => void) => {
    if (p != null && p.logger != null) return p.logger;
    return (v: string) => {
      // tslint:disable-next-line:no-console
      console.log(v);
    };
  };

  static read(p?: Parameters): QualifiedParameters {
    return {
      seed: QualifiedParameters.readSeed(p),
      num_runs: QualifiedParameters.readNumRuns(p),
      timeout: QualifiedParameters.readTimeout(p),
      logger: QualifiedParameters.readLogger(p),
      path: QualifiedParameters.readPath(p)
    };
  }
  static readOrNumRuns(p?: Parameters | number): QualifiedParameters {
    if (p == null) return QualifiedParameters.read();
    if (typeof p === 'number') return QualifiedParameters.read({ num_runs: p });
    return QualifiedParameters.read(p);
  }
}

interface RunDetails<Ts> {
  failed: boolean;
  num_runs: number;
  num_shrinks: number;
  seed: number;
  counterexample: Ts | null;
  error: string | null;
  counterexample_path: string | null;
}

function successFor<Ts>(qParams: QualifiedParameters): RunDetails<Ts> {
  return {
    failed: false,
    num_runs: qParams.num_runs,
    num_shrinks: 0,
    seed: qParams.seed,
    counterexample: null,
    counterexample_path: null,
    error: null
  };
}
function failureFor<Ts>(
  qParams: QualifiedParameters,
  num_runs: number,
  num_shrinks: number,
  counterexample: Ts,
  counterexample_path: string,
  error: string
): RunDetails<Ts> {
  return {
    failed: true,
    num_runs,
    num_shrinks,
    seed: qParams.seed,
    counterexample,
    counterexample_path,
    error
  };
}

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
          // tslint:disable-next-line:no-non-null-assertion
          this.value!,
          // tslint:disable-next-line:no-non-null-assertion
          mergePaths(qParams.path, this.pathToFailure!),
          this.failure
        );
  }
}

function prettyOne<Ts>(value: Ts): string {
  if (typeof value === 'string') return JSON.stringify(value);

  const defaultRepr: string = `${value}`;
  if (/^\[object (Object|Null|Undefined)\]$/.exec(defaultRepr) === null) return defaultRepr;
  try {
    return JSON.stringify(value);
  } catch (err) {}
  return defaultRepr;
}

function pretty<Ts>(value: Ts): string {
  if (Array.isArray(value)) return `[${[...value].map(pretty).join(',')}]`;
  return prettyOne(value);
}

function throwIfFailed<Ts>(out: RunDetails<Ts>) {
  if (out.failed) {
    throw new Error(
      `Property failed after ${out.num_runs} tests (seed: ${out.seed}, path: ${out.counterexample_path}): ${pretty(
        out.counterexample
      )}
Shrunk ${out.num_shrinks} time(s)
Got error: ${out.error}`
    );
  }
}

export { Parameters, QualifiedParameters, RunDetails, RunExecution, throwIfFailed };
