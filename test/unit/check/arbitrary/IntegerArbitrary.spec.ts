import * as fc from '../../../../lib/fast-check';

import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { integer, nat, maxSafeNat, maxSafeInteger } from '../../../../src/check/arbitrary/IntegerArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';

const isStrictlySmallerInteger = (v1: number, v2: number) => Math.abs(v1) < Math.abs(v2);

describe('IntegerArbitrary', () => {
  describe('integer', () => {
    it('Should not fail on single value range', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(), (seed, value) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = integer(value, value).generate(mrng).value;
          return g == value;
        })
      ));
    it('Should not suggest input in shrinked values', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(min, min + num);
          const shrinkable = arb.generate(mrng);
          return shrinkable.shrink().every(s => s.value != shrinkable.value);
        })
      ));
    it('Should shrink towards zero', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(min, min + num);
          const shrinkable = arb.generate(mrng);
          return shrinkable.value >= 0
            ? shrinkable.shrink().every(s => s.value <= shrinkable.value)
            : shrinkable.shrink().every(s => s.value >= shrinkable.value);
        })
      ));
    it('Should be able to call shrink multiple times', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(min, min + num);
          const shrinkable = arb.generate(mrng);
          const s1 = [...shrinkable.shrink()].map(s => s.value);
          const s2 = [...shrinkable.shrink()].map(s => s.value);
          return s1.length === s2.length && s1.every((v, idx) => v === s2[idx]);
        })
      ));
    it('Should always suggest one shrinked value if it can go towards zero', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(min, min + num);
          const shrinkable = arb.generate(mrng);
          const v = shrinkable.value;
          return (
            (min > 0 && v === min) ||
            (min + num < 0 && v === min + num) ||
            v === 0 ||
            [...shrinkable.shrink()].length > 0
          );
        })
      ));
    it('Should produce the same values for shrink on instance and on arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(min, min + num);
          const shrinkable = arb.generate(mrng);
          const shrinksInstance = [...shrinkable.shrink()].map(s => s.value);
          const shrinksArb = [...arb.shrink(shrinkable.value)];
          return (
            shrinksInstance.length === shrinksArb.length && shrinksInstance.every((v, idx) => v === shrinksArb[idx])
          );
        })
      ));
    it('Should not shrink twice towards zero', () =>
      fc.assert(
        fc.property(fc.integer().noShrink(), seed => {
          // all value between <sA> and <sB> are failure cases
          // we have a contiguous range of failures
          const mrng = stubRng.mutable.fastincrease(seed);
          const sA = integer().generate(mrng);
          const sB = integer().generate(mrng);
          const minValue = Math.min(sA.value, sB.value);
          const maxValue = Math.max(sA.value, sB.value);

          let shrinkable: Shrinkable<number> | null = sA;
          let numZeros = 0;

          // simulate the shrinking process
          // count we do not ask for zero multiple times
          while (shrinkable !== null) {
            const oldShrinkable: Shrinkable<number> | null = shrinkable;
            shrinkable = null;
            for (const smallerShrinkable of oldShrinkable.shrink()) {
              if (smallerShrinkable.value === 0) {
                expect(numZeros).toEqual(0);
                ++numZeros;
              }
              if (minValue <= smallerShrinkable.value && smallerShrinkable.value <= maxValue) {
                shrinkable = smallerShrinkable;
                break;
              }
            }
          }
        })
      ));

    const log2 = (v: number) => Math.log(v) / Math.log(2);

    it('Should be able to bias strictly positive integers', () =>
      fc.assert(
        fc.property(fc.integer(), genericHelper.minMax(fc.integer(1, 0x7fffffff)), (seed, range) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(range.min, range.max).withBias(1); // 100% of bias - not recommended outside of tests
          const g = arb.generate(mrng).value;
          if (range.min === range.max) {
            return g === range.min;
          }
          return g >= range.min && g - range.min <= log2(range.max - range.min);
        })
      ));
    it('Should be able to bias strictly negative integers', () =>
      fc.assert(
        fc.property(fc.integer(), genericHelper.minMax(fc.integer(-0x80000000, -1)), (seed, range) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(range.min, range.max).withBias(1); // 100% of bias - not recommended outside of tests
          const g = arb.generate(mrng).value;
          if (range.min === range.max) {
            return g === range.min;
          }
          return g <= range.max && range.max - g <= log2(range.max - range.min);
        })
      ));
    it('Should be able to bias negative and positive integers', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(-0x80000000, -1), fc.integer(1, 0x7fffffff), (seed, min, max) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(min, max).withBias(1); // 100% of bias - not recommended outside of tests
          const g = arb.generate(mrng).value;
          return -log2(-min) <= g && g <= log2(max);
        })
      ));
    it('Should throw when minimum number is greater than maximum one', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => {
          fc.pre(a !== b);
          if (a < b) expect(() => integer(b, a)).toThrowError();
          else expect(() => integer(a, b)).toThrowError();
        })
      ));
    describe('Given no constraints [between -2**31 and 2**31 -1]', () => {
      genericHelper.isValidArbitrary(() => integer(), {
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number) => typeof g === 'number' && -0x80000000 <= g && g <= 0x7fffffff
      });
    });
    describe('Given maximal value only [between -2**31 and max]', () => {
      genericHelper.isValidArbitrary((maxValue: number) => integer(maxValue), {
        seedGenerator: fc.integer(),
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number, maxValue: number) => typeof g === 'number' && -0x80000000 <= g && g <= maxValue
      });
    });
    describe('Given minimal and maximal values [between min and max]', () => {
      genericHelper.isValidArbitrary(
        (constraints: { min: number; max: number }) => integer(constraints.min, constraints.max),
        {
          seedGenerator: genericHelper.minMax(fc.integer()),
          isStrictlySmallerValue: isStrictlySmallerInteger,
          isValidValue: (g: number, constraints: { min: number; max: number }) =>
            typeof g === 'number' && constraints.min <= g && g <= constraints.max
        }
      );
    });
  });
  describe('maxSafeInteger', () => {
    describe('Given no constraints [between MIN_SAFE_INTEGER and MAX_SAFE_INTEGER]', () => {
      genericHelper.isValidArbitrary(() => maxSafeInteger(), {
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number) =>
          typeof g === 'number' && g >= Number.MIN_SAFE_INTEGER && g <= Number.MAX_SAFE_INTEGER
      });
    });
  });
  describe('nat', () => {
    it('Should throw when the number is less than 0', () =>
      fc.assert(
        fc.property(fc.integer(Number.MIN_SAFE_INTEGER, -1), n => {
          expect(() => nat(n)).toThrowError();
        })
      ));
    describe('Given no constraints [between 0 and 2**31 -1]', () => {
      genericHelper.isValidArbitrary(() => nat(), {
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number) => typeof g === 'number' && g >= 0 && g <= 0x7fffffff
      });
    });
    describe('Given maximal value only [between 0 and max]', () => {
      genericHelper.isValidArbitrary((maxValue: number) => nat(maxValue), {
        seedGenerator: fc.nat(),
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number, maxValue: number) => typeof g === 'number' && g >= 0 && g <= maxValue
      });
    });
  });
  describe('maxSafeNat', () => {
    describe('Given no constraints [between 0 and MAX_SAFE_INTEGER]', () => {
      genericHelper.isValidArbitrary(() => maxSafeNat(), {
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number) => typeof g === 'number' && g >= 0 && g <= Number.MAX_SAFE_INTEGER
      });
    });
  });
});
