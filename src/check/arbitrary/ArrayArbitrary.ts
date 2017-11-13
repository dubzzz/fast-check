import Arbitrary from './Arbitrary'
import { nat } from './IntegerArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { Stream, stream } from '../../stream/Stream'

class ArrayArbitrary<T> extends Arbitrary<T[]> {
    readonly lengthArb: Arbitrary<number>;
    constructor(readonly arb: Arbitrary<T>, maxLength: number) {
        super();
        this.lengthArb = nat(maxLength);
    }
    generate(mrng: MutableRandomGenerator): T[] {
        const size = this.lengthArb.generate(mrng);
        return [...Array(size)].map(() => this.arb.generate(mrng));
    }
    shrink(value: T[]): Stream<T[]> {
        // shrinking one by one is the not the most comprehensive
        // but allows a reasonable number of entries in the shrink
        if (value.length === 0) {
            return Stream.nil<T[]>();
        }
        return this.lengthArb.shrink(value.length).map(l => value.slice(value.length -l))
            .join(this.arb.shrink(value[0]).map(v => [v].concat(value.slice(1))))
            .join(this.shrink(value.slice(1)).map(vs => [value[0]].concat(vs)));
    }
}

function array<T>(arb: Arbitrary<T>): ArrayArbitrary<T>;
function array<T>(arb: Arbitrary<T>, maxLength: number): ArrayArbitrary<T>;
function array<T>(arb: Arbitrary<T>, maxLength?: number): ArrayArbitrary<T> {
    return new ArrayArbitrary<T>(arb, maxLength || 10);
}

export { array };
