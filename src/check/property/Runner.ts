import { RandomGenerator, skip_n } from '../../random/generator/RandomGenerator'
import MersenneTwister from '../../random/generator/MersenneTwister'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import IProperty from './IProperty'

interface Parameters {
    seed?: number;
    num_runs?: number;
}

function shrinkIt<Ts>(property: IProperty<Ts>, value: Ts, num_shrinks: number = 0): [Ts, number] {
    for (const v of property.shrink(value)) {
        if (!property.runOne(v)) {
            return shrinkIt(property, v, num_shrinks+1);
        }
    }
    return [value, num_shrinks];
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

function assert<Ts>(property: IProperty<Ts>, params?: Parameters) {
    const out = check(property, params);
    if (out.failed) {
        throw `Property failed after ${out.num_runs} tests (seed: ${out.seed}): ${out.counterexample}`;
    }
}

export { check, assert };