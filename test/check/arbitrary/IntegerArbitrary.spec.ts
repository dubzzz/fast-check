import * as assert from 'power-assert';
import RandomGenerator from '../../../src/random/generator/RandomGenerator';
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import { integer, nat } from '../../../src/check/arbitrary/IntegerArbitrary';
import * as jsc from 'jsverify';

class DummyRandomGenerator implements RandomGenerator {
    value: number;
    incr: number;
    constructor(value: number, incr?: number) {
        this.value = value;
        this.incr = incr === undefined || incr === 0 ? 1 : incr;
    }
    next(): [number, RandomGenerator] {
        // need to tweak incr in order to use a large range of values
        // uniform distribution expects some entropy
        return [this.value, new DummyRandomGenerator((this.value + this.incr) | 0, 2 * this.incr +1)];
    }
    min(): number {
        return -0x80000000;
    }
    max(): number {
        return 0x7fffffff;
    }
}

const MAX_SIZE: number = 2048;

describe("IntegerArbitrary", () => {
    describe('integer', () => {
        it('Should generate values between -2**31 and 2**31 -1 by default', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = integer().generate(mrng);
                return -0x80000000 <= g && g <= 0x7fffffff;
            })
        ));
        it('Should generate values between -2**31 and max', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, (seed, max) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = integer(max).generate(mrng);
                return -0x80000000 <= g && g <= max;
            })
        ));
        it('Should generate values between min and max', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = integer(min, min + num).generate(mrng);
                return min <= g && g <= min + num;
            })
        ));
    });
    describe('nat', () => {
        it('Should generate values between 0 and 2**31 -1 by default', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = nat().generate(mrng);
                return 0 <= g && g <= 0x7fffffff;
            })
        ));
        it('Should generate values between 0 and max', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.nat, (seed, max) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = nat(max).generate(mrng);
                return 0 <= g && g <= max;
            })
        ));
    });
});
