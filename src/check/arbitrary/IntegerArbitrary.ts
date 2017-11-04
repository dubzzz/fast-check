import Arbitrary from './Arbitrary'
import UniformDistribution from '../../random/distribution/UniformDistribution'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

class IntegerArbitrary implements Arbitrary<number> {
    static MIN_INT: number = 0x80000000 | 0;
    static MAX_INT: number = 0x7fffffff | 0;

    readonly min: number;
    readonly max: number;
    constructor(min?: number, max?: number) {
        this.min = min === undefined ? IntegerArbitrary.MIN_INT : min;
        this.max = max === undefined ? IntegerArbitrary.MAX_INT : max;
    }
    generate(mrng: MutableRandomGenerator): number {
        return UniformDistribution.inRange(this.min, this.max)(mrng)[0];
    }
}

function integer(): IntegerArbitrary;
function integer(max: number): IntegerArbitrary;
function integer(min: number, max: number): IntegerArbitrary;
function integer(a?: number, b?: number): IntegerArbitrary {
    return b === undefined
        ? new IntegerArbitrary(undefined, a)
        : new IntegerArbitrary(a, b);
}

function nat(): IntegerArbitrary;
function nat(max: number): IntegerArbitrary;
function nat(a?: number): IntegerArbitrary {
    return new IntegerArbitrary(0, a);
}

export { integer, nat };
