import Arbitrary from './Arbitrary'
import { nat } from './IntegerArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

class ArrayArbitrary<T> implements Arbitrary<T[]> {
    readonly arb: Arbitrary<T>;
    readonly lengthArb: Arbitrary<number>;
    constructor(arb: Arbitrary<T>, maxLength: number) {
        this.arb = arb;
        this.lengthArb = nat(maxLength);
    }
    generate(mrng: MutableRandomGenerator): T[] {
        const size = this.lengthArb.generate(mrng);
        return [...Array(size)].map(() => this.arb.generate(mrng));
    }
}

function array<T>(arb: Arbitrary<T>): ArrayArbitrary<T>;
function array<T>(arb: Arbitrary<T>, maxLength: number): ArrayArbitrary<T>;
function array<T>(arb: Arbitrary<T>, maxLength?: number): ArrayArbitrary<T> {
    return new ArrayArbitrary<T>(arb, maxLength || 10);
}

export { array };
