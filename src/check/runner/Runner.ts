import Shrinkable from '../arbitrary/definition/Shrinkable'
import { RandomGenerator, skip_n } from '../../random/generator/RandomGenerator'
import IProperty from '../property/IProperty'
import toss from './Tosser'

export interface Parameters {
    seed?: number;
    num_runs?: number;
}

function shrinkIt<Ts>(property: IProperty<Ts>, value: Shrinkable<Ts>, error: string, num_shrinks: number = 0): [Ts, number, string] {
    for (const v of value.shrink()) {
        const out = property.run(v.value);
        if (out != null) {
            return shrinkIt(property, v, out, num_shrinks+1);
        }
    }
    return [value.value, num_shrinks, error];
}

function check<Ts>(property: IProperty<Ts>, params?: Parameters) {
    const seed = (params && params.seed != null) ? params.seed as number : Date.now();
    const num_runs = (params && params.num_runs != null) ? params.num_runs as number : 100;
    const generator = toss(property, seed);

    for (let idx = 0 ; idx < num_runs ; ++idx) {
        const g = generator.next().value;
        const out = property.run(g.value);
        if (out != null) {
            const [shrinkedValue, numShrinks, error] = shrinkIt(property, g, out as string);
            return {failed: true, num_runs: idx+1, num_shrinks: numShrinks, seed: seed, counterexample: shrinkedValue, error: error};
        }
    }
    return {failed: false, num_runs: num_runs, num_shrinks: 0, seed: seed, counterexample: null, error: null};
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

function assert<Ts>(property: IProperty<Ts>, params?: Parameters) {
    const out = check(property, params);
    if (out.failed) {
        throw `Property failed after ${out.num_runs} tests (seed: ${out.seed}): ${pretty(out.counterexample)}\nGot error: ${out.error}`;
    }
}

export { check, assert };