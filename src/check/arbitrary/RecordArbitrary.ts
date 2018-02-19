import Arbitrary from './definition/Arbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

import { option } from './OptionArbitrary'
import { generic_tuple } from './TupleArbitrary'

export interface RecordConstraints {
    with_deleted_keys?: boolean;
}

function rawRecord<T>(recordModel: {[Key:string]: Arbitrary<T>}): Arbitrary<{[Key:string]: T}> {
    const keys = Object.keys(recordModel);
    const arbs: Arbitrary<T>[] = keys.map(v => recordModel[v]);
    return generic_tuple(arbs).map((gs: T[]) => {
        const obj: {[Key:string]: T} = {};
        for (let idx = 0 ; idx != keys.length ; ++idx)
            obj[keys[idx]] = gs[idx];
        return obj;
    });
}

function record<T>(recordModel: {[Key:string]: Arbitrary<T>}): Arbitrary<{[Key:string]: T}>;
function record<T>(recordModel: {[Key:string]: Arbitrary<T>}, constraints: RecordConstraints): Arbitrary<{[Key:string]: T}>;
function record<T>(recordModel: {[Key:string]: Arbitrary<T>}, constraints?: RecordConstraints): Arbitrary<{[Key:string]: T}> {
    if (constraints == null || constraints.with_deleted_keys !== true)
        return rawRecord(recordModel);
    
    const updatedRecordModel: {[Key:string]: Arbitrary<{value:T} | null>} = {};
    for (const k of Object.keys(recordModel))
        updatedRecordModel[k] = option(recordModel[k].map(v => {return {value: v}}));
    return rawRecord(updatedRecordModel).map(obj => {
        const nobj: {[Key:string]: T} = {};
        for (const k of Object.keys(obj)) {
            if (obj[k] != null)
                nobj[k] = obj[k]!.value;
        }
        return nobj;
    });
}

export { record };
