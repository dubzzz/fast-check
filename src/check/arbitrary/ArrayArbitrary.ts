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
        let s = this.lengthArb.shrink(value.length)
            .map(l => value.slice(0, l));
        for (let idx = 0 ; idx !== value.length ; ++idx) {
            s = s.join(
                this.arb.shrink(value[idx])
                    .map(v => value.slice(0, idx).concat([v]).concat(value.slice(idx+1)))
            );
        }
        return s;
    }
}

function array<T>(arb: Arbitrary<T>): ArrayArbitrary<T>;
function array<T>(arb: Arbitrary<T>, maxLength: number): ArrayArbitrary<T>;
function array<T>(arb: Arbitrary<T>, maxLength?: number): ArrayArbitrary<T> {
    return new ArrayArbitrary<T>(arb, maxLength || 10);
}

export { array };
