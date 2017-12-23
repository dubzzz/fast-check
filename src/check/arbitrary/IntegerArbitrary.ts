import Arbitrary from './Arbitrary'
import UniformDistribution from '../../random/distribution/UniformDistribution'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { stream, Stream } from '../../stream/Stream'

class IntegerArbitrary extends Arbitrary<number> {
    static MIN_INT: number = 0x80000000 | 0;
    static MAX_INT: number = 0x7fffffff | 0;

    readonly min: number;
    readonly max: number;
    constructor(min?: number, max?: number) {
        super();
        this.min = min === undefined ? IntegerArbitrary.MIN_INT : min;
        this.max = max === undefined ? IntegerArbitrary.MAX_INT : max;
    }
    generate(mrng: MutableRandomGenerator): number {
        return UniformDistribution.inRange(this.min, this.max)(mrng)[0];
    }
    private shrink_to(value: number, target: number): Stream<number> {
        const gap = value - target;
        function* shrink_decr(): IterableIterator<number> {
            for (let toremove = gap ; toremove > 0 ; toremove = Math.floor(toremove/2)) {
                yield (value - toremove);
            }
        }
        function* shrink_incr(): IterableIterator<number> {
            for (let toremove = gap ; toremove < 0 ; toremove = Math.ceil(toremove/2)) {
                yield (value - toremove);
            }
        }
        return gap > 0 ? stream(shrink_decr()) : stream(shrink_incr());
    }
    shrink(value: number): Stream<number> {
        if (this.min <= 0 && this.max >= 0) {
            return this.shrink_to(value, 0);
        }
        return value < 0 ? this.shrink_to(value, this.max) : this.shrink_to(value, this.min);
    }
}

function integer(): Arbitrary<number>;
function integer(max: number): Arbitrary<number>;
function integer(min: number, max: number): Arbitrary<number>;
function integer(a?: number, b?: number): Arbitrary<number> {
    return b === undefined
        ? new IntegerArbitrary(undefined, a)
        : new IntegerArbitrary(a, b);
}

function nat(): Arbitrary<number>;
function nat(max: number): Arbitrary<number>;
function nat(a?: number): Arbitrary<number> {
    return new IntegerArbitrary(0, a);
}

export { integer, nat };
