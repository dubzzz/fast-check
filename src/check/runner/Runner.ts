import Shrinkable from '../arbitrary/definition/Shrinkable'
import { RandomGenerator, skip_n } from '../../random/generator/RandomGenerator'
import IProperty from '../property/IProperty'
import toss from './Tosser'
import { Parameters, QualifiedParameters, pretty } from './utils/utils'

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
    const qParams = QualifiedParameters.read(params);
    const generator = toss(property, qParams.seed);

    for (let idx = 0 ; idx < qParams.num_runs ; ++idx) {
        const g = generator.next().value;
        const out = property.run(g.value);
        if (out != null) {
            const [shrinkedValue, numShrinks, error] = shrinkIt(property, g, out as string);
            return {failed: true, num_runs: idx+1, num_shrinks: numShrinks, seed: qParams.seed, counterexample: shrinkedValue, error: error};
        }
    }
    return {failed: false, num_runs: qParams.num_runs, num_shrinks: 0, seed: qParams.seed, counterexample: null, error: null};
}

function assert<Ts>(property: IProperty<Ts>, params?: Parameters) {
    const out = check(property, params);
    if (out.failed) {
        throw `Property failed after ${out.num_runs} tests (seed: ${out.seed}): ${pretty(out.counterexample)}\nGot error: ${out.error}`;
    }
}

export { check, assert };