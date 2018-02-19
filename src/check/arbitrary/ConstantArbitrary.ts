import Arbitrary from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { nat } from './IntegerArbitrary'
import { stream, Stream } from '../../stream/Stream'

class ConstantArbitrary<T> extends Arbitrary<T> {
    readonly idArb: Arbitrary<number>;
    constructor(readonly values: T[]) {
        super();
        this.idArb = nat(values.length -1);
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<T> {
        if (this.values.length === 1)
            return new Shrinkable(this.values[0]);
        
        const id = this.idArb.generate(mrng).value;
        if (id === 0)
            return new Shrinkable(this.values[0]);
        
        function* g(v: T) { yield new Shrinkable(v); }
        return new Shrinkable(this.values[id], () => stream(g(this.values[0])));
    }
}

function constant<T>(value: T): Arbitrary<T> {
    return new ConstantArbitrary<T>([value]);
}

function constantFrom<T>(v0: T, ...values: T[]): Arbitrary<T> {
    return new ConstantArbitrary<T>([v0, ...values]);
}

export { constant, constantFrom };
