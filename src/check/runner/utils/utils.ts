interface Parameters {
    seed?: number;
    num_runs?: number;
    timeout?: number;
    logger?: (v: string) => void;
}
class QualifiedParameters {
    seed: number;
    num_runs: number;
    timeout: number | null;
    logger: (v: string) => void;
    
    private static read_seed = (p?: Parameters): number => p != null && p.seed != null ? p.seed : Date.now();
    private static read_num_runs = (p?: Parameters): number => p != null && p.num_runs != null ? p.num_runs : 100;
    private static read_timeout = (p?: Parameters): number | null => p != null && p.timeout != null ? p.timeout : null;
    private static read_logger = (p?: Parameters): ((v: string) => void) => p != null && p.logger != null ? p.logger : (v: string) => console.log(v);

    static read(p?: Parameters): QualifiedParameters {
        return {
            seed: QualifiedParameters.read_seed(p),
            num_runs: QualifiedParameters.read_num_runs(p),
            timeout: QualifiedParameters.read_timeout(p),
            logger: QualifiedParameters.read_logger(p)
        };
    }
    static read_or_num_runs(p?: (Parameters|number)): QualifiedParameters {
        if (p == null) return QualifiedParameters.read();
        if (typeof p == 'number') return QualifiedParameters.read({ num_runs: p as number });
        return QualifiedParameters.read(p as Parameters);
    }
}

interface RunDetails<Ts> {
    failed: boolean,
    num_runs: number,
    num_shrinks: number,
    seed: number,
    counterexample: Ts|null,
    error: string|null,
    counterexample_path: string|null,
}

function successFor<Ts>(qParams: QualifiedParameters): RunDetails<Ts> {
    return {failed: false, num_runs: qParams.num_runs, num_shrinks: 0, seed: qParams.seed, counterexample: null, counterexample_path: null, error: null};
}
function failureFor<Ts>(qParams: QualifiedParameters, num_runs: number, num_shrinks: number, counterexample: Ts, counterexample_path: string, error: string): RunDetails<Ts> {
    return {failed: true, num_runs, num_shrinks, seed: qParams.seed, counterexample, counterexample_path, error};
}

class RunExecution<Ts> {
    public pathToFailure?: string;
    public value?: Ts;
    public failure: string;
    
    public fail(value: Ts, id: number, message: string) {
        if (this.pathToFailure == null)
            this.pathToFailure = `${id}`;
        else
            this.pathToFailure += `:${id}`;
        this.value = value;
        this.failure = message;
    }

    private isSuccess = (): boolean => this.pathToFailure == null;
    private firstFailure = (): number => this.pathToFailure ? +this.pathToFailure.split(':')[0] : -1;
    private numShrinks = (): number => this.pathToFailure ? this.pathToFailure.split(':').length -1 : 0;

    public toRunDetails(qParams: QualifiedParameters): RunDetails<Ts> {
        return this.isSuccess()
            ? successFor<Ts>(qParams)
            : failureFor<Ts>(qParams, this.firstFailure() +1, this.numShrinks(), this.value!, this.pathToFailure!, this.failure);
    }
}

function prettyOne(value: any): string {
    if (typeof value === 'string')
        return JSON.stringify(value);
    
    const defaultRepr: string = `${value}`;
    if (/^\[object (Object|Null|Undefined)\]$/.exec(defaultRepr) === null)
        return defaultRepr;
    try {
        return JSON.stringify(value);
    }
    catch (err) {}
    return defaultRepr;
}

function pretty<Ts>(value: any): string {
    if (Array.isArray(value))
        return `[${[...value].map(pretty).join(',')}]`;
    return prettyOne(value);
}

function throwIfFailed<Ts>(out: RunDetails<Ts>) {
    if (out.failed) {
        throw new Error(
            `Property failed after ${out.num_runs} tests (seed: ${out.seed}, path: ${out.counterexample_path}): ${pretty(out.counterexample)}\n` +
            `Shrunk ${out.num_shrinks} time(s)\n` +
            `Got error: ${out.error}`);
    }
}

export { Parameters, QualifiedParameters, RunDetails, RunExecution, throwIfFailed };