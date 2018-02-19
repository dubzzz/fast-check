import Arbitrary from './definition/Arbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

import { generic_tuple } from './TupleArbitrary'

function record<T>(recordModel: {[Key:string]: Arbitrary<T>}): Arbitrary<{[Key:string]: T}> {
    const keys = Object.keys(recordModel);
    const arbs: Arbitrary<T>[] = keys.map(v => recordModel[v]);
    return generic_tuple(arbs).map((gs: T[]) => {
        const obj: {[Key:string]: T} = {};
        for (let idx = 0 ; idx != keys.length ; ++idx)
            obj[keys[idx]] = gs[idx];
        return obj;
    });
}

export { record };
