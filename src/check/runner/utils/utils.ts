interface Parameters {
  seed?: number;
  numRuns?: number;
  timeout?: number;
  path?: string;
  logger?(v: string): void;
}

/** @hidden */
class QualifiedParameters {
  seed: number;
  numRuns: number;
  timeout: number | null;
  path: string;
  logger: (v: string) => void;

  private static readSeed = (p?: Parameters): number => (p != null && p.seed != null ? p.seed : Date.now());
  private static readNumRuns = (p?: Parameters): number => {
    const defaultValue = 100;
    if (p == null) return defaultValue;
    if (p.numRuns != null) return p.numRuns;
    if ((p as { num_runs?: number }).num_runs != null) return (p as { num_runs: number }).num_runs;
    return defaultValue;
  };
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
      numRuns: QualifiedParameters.readNumRuns(p),
      timeout: QualifiedParameters.readTimeout(p),
      logger: QualifiedParameters.readLogger(p),
      path: QualifiedParameters.readPath(p)
    };
  }
  static readOrNumRuns(p?: Parameters | number): QualifiedParameters {
    if (p == null) return QualifiedParameters.read();
    if (typeof p === 'number') return QualifiedParameters.read({ numRuns: p });
    return QualifiedParameters.read(p);
  }
}

interface RunDetails<Ts> {
  failed: boolean;
  numRuns: number;
  numShrinks: number;
  seed: number;
  counterexample: Ts | null;
  error: string | null;
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

export { Parameters, QualifiedParameters, RunDetails, RunExecution, throwIfFailed };
