interface Parameters {
    seed?: number;
    num_runs?: number;
    logger?: (v: string) => void;
}
class QualifiedParameters {
    seed: number;
    num_runs: number;
    logger: (v: string) => void;
    
    private static read_seed = (p?: Parameters): number => p != null && p.seed != null ? p.seed : Date.now();
    private static read_num_runs = (p?: Parameters): number => p != null && p.num_runs != null ? p.num_runs : 100;
    private static read_logger = (p?: Parameters): ((v: string) => void) => p != null && p.logger != null ? p.logger : (v: string) => console.log(v);

    static read(p?: Parameters): QualifiedParameters {
        return {
            seed: QualifiedParameters.read_seed(p),
            num_runs: QualifiedParameters.read_num_runs(p),
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
}

function successFor<Ts>(qParams: QualifiedParameters): RunDetails<Ts> {
    return {failed: false, num_runs: qParams.num_runs, num_shrinks: 0, seed: qParams.seed, counterexample: null, error: null};
}
function failureFor<Ts>(qParams: QualifiedParameters, num_runs: number, num_shrinks: number, counterexample: Ts, error: string): RunDetails<Ts> {
    return {failed: true, num_runs, num_shrinks, seed: qParams.seed, counterexample, error};
}

function prettyOne(value: any): string {
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
            `Property failed after ${out.num_runs} tests (seed: ${out.seed}): ${pretty(out.counterexample)}\n` +
            `Got error: ${out.error}`);
    }
}

export { Parameters, QualifiedParameters, RunDetails, successFor, failureFor, throwIfFailed };