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
                const g = integer().generate(mrng).value;
                return -0x80000000 <= g && g <= 0x7fffffff;
            })
        ));
        it('Should generate values between -2**31 and max', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, (seed, max) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = integer(max).generate(mrng).value;
                return -0x80000000 <= g && g <= max;
            })
        ));
        it('Should generate values between min and max', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = integer(min, min + num).generate(mrng).value;
                return min <= g && g <= min + num;
            })
        ));
        it('Should not fail on single value range', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.nat, (seed, value) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = integer(value, value).generate(mrng).value;
                return g == value;
            })
        ));
        it('Should shrink values between min and max', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = integer(min, min + num);
                const shrinkable = arb.generate(mrng);
                return shrinkable.shrink().every(s => min <= s.value && s.value <= min + num);
            })
        ));
        it('Should not suggest input in shrinked values', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = integer(min, min + num);
                const shrinkable = arb.generate(mrng);
                return shrinkable.shrink().every(s => s.value != shrinkable.value);
            })
        ));
        it('Should shrink towards zero', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = integer(min, min + num);
                const shrinkable = arb.generate(mrng);
                return shrinkable.value >= 0
                    ? shrinkable.shrink().every(s => s.value <= shrinkable.value)
                    : shrinkable.shrink().every(s => s.value >= shrinkable.value);
            })
        ));
        it('Should be able to call shrink multiple times', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = integer(min, min + num);
                const shrinkable = arb.generate(mrng);
                const s1 = [...shrinkable.shrink()].map(s => s.value);
                const s2 = [...shrinkable.shrink()].map(s => s.value);
                return s1.length === s2.length && s1.every((v, idx) => v === s2[idx]);
            })
        ));
        it('Should always suggest one shrinked value if it can go towards zero', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = integer(min, min + num);
                const shrinkable = arb.generate(mrng);
                const v = shrinkable.value;
                return (min > 0 && v === min)
                    || (min + num < 0 && v === min + num)
                    || v === 0
                    || [...shrinkable.shrink()].length > 0;
            })
        ));
        it('Should produce the same values for shrink on instance and on arbitrary', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.nat, (seed, min, num) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const arb = integer(min, min + num);
                const shrinkable = arb.generate(mrng);
                const shrinksInstance = [...shrinkable.shrink()].map(s => s.value);
                const shrinksArb = [...arb.shrink(shrinkable.value)];
                return shrinksInstance.length === shrinksArb.length && shrinksInstance.every((v, idx) => v === shrinksArb[idx]);
            })
        ));
    });
    describe('nat', () => {
        it('Should generate values between 0 and 2**31 -1 by default', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = nat().generate(mrng).value;
                return 0 <= g && g <= 0x7fffffff;
            })
        ));
        it('Should generate values between 0 and max', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.nat, (seed, max) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = nat(max).generate(mrng).value;
                return 0 <= g && g <= max;
            })
        ));
    });
});
