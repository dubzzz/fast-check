interface Parameters {
    seed?: number;
    num_runs?: number;
}
class QualifiedParameters {
    seed: number;
    num_runs: number;
    
    private static read_seed = (p?: Parameters): number => p != null && p.seed != null ? p.seed : Date.now();
    private static read_num_runs = (p?: Parameters): number => p != null && p.num_runs != null ? p.num_runs : 100;

    static read(p?: Parameters): QualifiedParameters {
        return {
            seed: QualifiedParameters.read_seed(p),
            num_runs: QualifiedParameters.read_num_runs(p)
        };
    }
    static read_or_num_runs(p?: (Parameters|number)): QualifiedParameters {
        if (p == null) return QualifiedParameters.read();
        if (typeof p == 'number') return QualifiedParameters.read({ num_runs: p as number });
        return QualifiedParameters.read(p as Parameters);
    }
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

export { Parameters, QualifiedParameters, pretty };