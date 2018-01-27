import Arbitrary from './definition/Arbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

import { array } from './ArrayArbitrary'
import { tuple } from './TupleArbitrary'

function toObject<T>(items: [string, T][]): {[Key:string]:T} {
    const obj: {[Key:string]:T} = {};
    for (const keyValue of items) {
        obj[keyValue[0]] = keyValue[1];
    }
    return obj;
}

function dictionary<T>(keyArb: Arbitrary<string>, valueArb: Arbitrary<T>): Arbitrary<{[Key:string]:T}> {
    return array(tuple(keyArb, valueArb))
            .map(toObject);
}

export { dictionary };
