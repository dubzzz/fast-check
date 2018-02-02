import Arbitrary from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

import { array } from './ArrayArbitrary'
import { boolean } from './BooleanArbitrary'
import { constant } from './ConstantArbitrary'
import { dictionary } from './DictionaryArbitrary'
import { double } from './FloatingPointArbitrary'
import { integer } from './IntegerArbitrary'
import { oneof } from './OneOfArbitrary'
import { string, unicodeString } from './StringArbitrary'
import { tuple } from './TupleArbitrary'

export class ObjectConstraints {
    constructor(readonly key: Arbitrary<string>, readonly values: Arbitrary<any>[], readonly maxDepth: number) {}
    next(): ObjectConstraints {
        return new ObjectConstraints(
                this.key,
                this.values,
                this.maxDepth -1);
    }

    static defaultValues(): Arbitrary<any>[] {
        return [
                boolean(), integer(), double(), string(),
                oneof(
                    constant(null), constant(undefined),
                    constant(Number.NaN),
                    constant(Number.MIN_VALUE), constant(Number.MAX_VALUE),
                    constant(Number.MIN_SAFE_INTEGER), constant(Number.MAX_SAFE_INTEGER))
            ];
    }

    static from(settings?: ObjectConstraints.Settings): ObjectConstraints {
        function getOr<T>(access: () => (T|undefined), value: T): T {
            return settings != null && access() != null ? access()! : value;
        }
        return new ObjectConstraints(
                getOr(() => settings!.key, string()),
                getOr(() => settings!.values, ObjectConstraints.defaultValues()),
                getOr(() => settings!.maxDepth, 2));
    }
};

export module ObjectConstraints {
    export interface Settings {
        maxDepth?: number;         // maximal depth allowed for this object
        key?: Arbitrary<string>;   // arbitrary for key
        values?: Arbitrary<any>[]; // arbitrary responsible for base value
    };
};

class ObjectArbitrary extends Arbitrary<any> {
    constructor(readonly constraints: ObjectConstraints) {
        super();
    }
    static anything(constraints: ObjectConstraints): Arbitrary<any> {
        const potentialArbValue= [...constraints.values]; // base
        if (constraints.maxDepth > 0) {
            potentialArbValue.push(new ObjectArbitrary(constraints.next()));             // sub-object
            potentialArbValue.push(...constraints.values.map(arb => array(arb)));        // arrays of base
            potentialArbValue.push(array(ObjectArbitrary.anything(constraints.next()))); // mixed content arrays
        }
        if (constraints.maxDepth > 1) {
            potentialArbValue.push(array(new ObjectArbitrary(constraints.next().next()))); // array of Object
        }
        return oneof(potentialArbValue[0], ...potentialArbValue.slice(0));
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<any> {
        return dictionary(
                this.constraints.key,
                ObjectArbitrary.anything(this.constraints)
            ).generate(mrng);
    }
}

function anything(): Arbitrary<any>;
function anything(settings: ObjectConstraints.Settings): Arbitrary<any>;
function anything(settings?: ObjectConstraints.Settings): Arbitrary<any> {
    return ObjectArbitrary.anything(ObjectConstraints.from(settings));
}

function object(): Arbitrary<any>;
function object(settings: ObjectConstraints.Settings): Arbitrary<any>;
function object(settings?: ObjectConstraints.Settings): Arbitrary<any> {
    return new ObjectArbitrary(ObjectConstraints.from(settings));
}

function jsonSettings(stringArbitrary: Arbitrary<string>, maxDepth?: number) {
    const key = stringArbitrary;
    const values = [boolean(), integer(), double(), stringArbitrary, constant(null)];
    return maxDepth != null ? {key, values, maxDepth} : {key, values};
}

function json(): Arbitrary<string>;
function json(maxDepth: number): Arbitrary<string>;
function json(maxDepth?: number): Arbitrary<string> {
    return anything(jsonSettings(string(), maxDepth)).map(JSON.stringify);
}

function unicodeJson(): Arbitrary<string>;
function unicodeJson(maxDepth: number): Arbitrary<string>;
function unicodeJson(maxDepth?: number): Arbitrary<string> {
    return anything(jsonSettings(unicodeString(), maxDepth)).map(JSON.stringify);
}

export { anything, object, json, unicodeJson };
