import { RandomGenerator, skip_n } from '../../random/generator/RandomGenerator'
import MersenneTwister from '../../random/generator/MersenneTwister'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import IProperty from './IProperty'

interface Parameters {
    seed?: number;
    num_runs?: number;
}

function check<Ts>(property: IProperty<Ts>, params?: Parameters) {
    const seed = (params && params.seed !== null) ? params.seed as number : Date.now();
    const num_runs = (params && params.num_runs !== null) ? params.num_runs as number : 100;

    let rng: RandomGenerator = MersenneTwister.from(seed);
    for (let idx = 0 ; idx !== num_runs ; ++idx) {
        rng = skip_n(rng, 42);
        if (! property.run(new MutableRandomGenerator(rng))) {
            return {failed: true, num_runs: idx+1, seed: seed};
        }
    }
    return {failed: false, num_runs: num_runs, seed: seed};
}

function assert<Ts>(property: IProperty<Ts>, params?: Parameters) {
    const out = check(property, params);
    if (out.failed) {
        throw `Property failed after ${out.num_runs} tests (seed: ${out.seed})`;
    }
}

export { check, assert };