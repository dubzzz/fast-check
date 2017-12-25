import Shrinkable from '../arbitrary/definition/Shrinkable'
import { RandomGenerator, skip_n } from '../../random/generator/RandomGenerator'
import MersenneTwister from '../../random/generator/MersenneTwister'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import IProperty from './IProperty'

interface Parameters {
    seed?: number;
    num_runs?: number;
}

function shrinkIt<Ts>(property: IProperty<Ts>, value: Shrinkable<Ts>, num_shrinks: number = 0): [Ts, number] {
    for (const v of value.shrink()) {
        if (!property.runOne(v.value)) {
            return shrinkIt(property, v, num_shrinks+1);
        }
    }
    return [value.value, num_shrinks];
}

function check<Ts>(property: IProperty<Ts>, params?: Parameters) {
    const seed = (params && params.seed != null) ? params.seed as number : Date.now();
    const num_runs = (params && params.num_runs != null) ? params.num_runs as number : 100;

    let rng: RandomGenerator = MersenneTwister.from(seed);
    for (let idx = 0 ; idx < num_runs ; ++idx) {
        rng = skip_n(rng, 42);
        const out = property.run(new MutableRandomGenerator(rng));
        if (!out[0]) {
            const [shrinkedValue, numShrinks] = shrinkIt(property, out[1]);
            return {failed: true, num_runs: idx+1, num_shrinks: numShrinks, seed: seed, counterexample: shrinkedValue};
        }
    }
    return {failed: false, num_runs: num_runs, num_shrinks: 0, seed: seed, counterexample: null};
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
        throw `Property failed after ${out.num_runs} tests (seed: ${out.seed}): ${pretty(out.counterexample)}`;
    }
}

export { check, assert };