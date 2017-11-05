import * as assert from 'power-assert';
import { DummyRandomGenerator } from './TestRandomGenerator'
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import { integer, nat } from '../../../src/check/arbitrary/IntegerArbitrary';
import * as jsc from 'jsverify';

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
