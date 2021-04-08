import * as fc from '../../../lib/fast-check';

import { integer } from '../../../src/arbitrary/integer';
import { nat } from '../../../src/arbitrary/nat';
import { maxSafeNat } from '../../../src/arbitrary/maxSafeNat';
import { maxSafeInteger } from '../../../src/arbitrary/maxSafeInteger';

import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';

import * as stubRng from '../stubs/generators';
import { generateOneValue } from '../check/arbitrary/generic/GenerateOneValue';
import { buildShrinkTree, renderTree } from '../check/arbitrary/generic/ShrinkTree';

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
          return shrinkable.shrink().every((s) => s.value != shrinkable.value);
        })
      ));
    it('Should shrink towards zero', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(min, min + num);
          const shrinkable = arb.generate(mrng);
          return shrinkable.value >= 0
            ? shrinkable.shrink().every((s) => s.value <= shrinkable.value)
            : shrinkable.shrink().every((s) => s.value >= shrinkable.value);
        })
      ));
    it('Should be able to call shrink multiple times', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(min, min + num);
          const shrinkable = arb.generate(mrng);
          const s1 = [...shrinkable.shrink()].map((s) => s.value);
          const s2 = [...shrinkable.shrink()].map((s) => s.value);
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
          const shrinksInstance = [...shrinkable.shrink()].map((s) => s.value);
          const shrinksArb = [...arb.shrink(shrinkable.value)];
          return (
            shrinksInstance.length === shrinksArb.length && shrinksInstance.every((v, idx) => v === shrinksArb[idx])
          );
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
          return (
            (range.min <= g && g <= range.min + log2(range.max - range.min)) ||
            (range.max - log2(range.max - range.min) <= g && g <= range.max)
          );
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
          return (
            (range.min <= g && g <= range.min + log2(range.max - range.min)) ||
            (range.max - log2(range.max - range.min) <= g && g <= range.max)
          );
        })
      ));
    it('Should be able to bias negative and positive integers', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(-0x80000000, -1), fc.integer(1, 0x7fffffff), (seed, min, max) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = integer(min, max).withBias(1); // 100% of bias - not recommended outside of tests
          const g = arb.generate(mrng).value;
          return (
            (-log2(-min) <= g && g <= log2(max)) ||
            (min <= g && g <= min + log2(-min)) ||
            (max - log2(max) <= g && g <= max)
          );
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
        isValidValue: (g: number) => typeof g === 'number' && -0x80000000 <= g && g <= 0x7fffffff,
      });
    });
    describe('Given minimal value only [between min and 2**31 -1]', () => {
      genericHelper.isValidArbitrary((min: number) => integer({ min }), {
        seedGenerator: fc.integer(),
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number, min: number) => typeof g === 'number' && min <= g && g <= 0x7fffffff,
      });
    });
    describe('Given maximal value only [between -2**31 and max]', () => {
      genericHelper.isValidArbitrary((maxValue: number) => integer(maxValue), {
        seedGenerator: fc.integer(),
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number, maxValue: number) => typeof g === 'number' && -0x80000000 <= g && g <= maxValue,
      });
    });
    describe('Given minimal and maximal values [between min and max]', () => {
      genericHelper.isValidArbitrary(
        (constraints: { min: number; max: number }) => integer(constraints.min, constraints.max),
        {
          seedGenerator: genericHelper.minMax(fc.integer()),
          isStrictlySmallerValue: isStrictlySmallerInteger,
          isValidValue: (g: number, constraints: { min: number; max: number }) => {
            const out = typeof g === 'number' && constraints.min <= g && g <= constraints.max;
            if (!out) throw new Error(fc.stringify({ g, constraints }));
            return out;
          },
        }
      );
    });
    describe('Still support older signatures', () => {
      it('Should support fc.integer(max)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.integer(), (seed, max) => {
            const refArbitrary = integer({ max });
            const otherArbitrary = integer(max);
            expect(generateOneValue(seed, otherArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
      it('Should support fc.integer(min, max)', () => {
        fc.assert(
          fc.property(fc.integer(), genericHelper.minMax(fc.integer()), (seed, constraints) => {
            const refArbitrary = integer(constraints);
            const otherArbitrary = integer(constraints.min, constraints.max);
            expect(generateOneValue(seed, otherArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
    });

    describe('contextualShrinkableFor', () => {
      it('Should shrink strictly positive value for positive range including zero', () => {
        // Arrange
        const arb = integer({ min: 0, max: 10 });

        // Act
        const tree = buildShrinkTree(arb.contextualShrinkableFor(8));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        //   When there is no more option, the shrinker retry one time with the value
        //   current-1 to check if something that changed outside (another value not itself)
        //   may have changed the situation.
        expect(renderedTree).toMatchInlineSnapshot(`
          "8
          ├> 0
          ├> 4
          |  ├> 2
          |  |  └> 1
          |  |     └> 0
          |  └> 3
          |     └> 2
          |        ├> 0
          |        └> 1
          |           └> 0
          ├> 6
          |  └> 5
          |     └> 4
          |        ├> 0
          |        ├> 2
          |        |  └> 1
          |        |     └> 0
          |        └> 3
          |           └> 2
          |              ├> 0
          |              └> 1
          |                 └> 0
          └> 7
             └> 6
                ├> 0
                ├> 3
                |  └> 2
                |     └> 1
                |        └> 0
                └> 5
                   └> 4
                      └> 3
                         ├> 0
                         └> 2
                            └> 1
                               └> 0"
        `);

        // Remarks:
        // * When we shrink 5 in path 8 > 6 > 5
        //   we already now that 4 passed so we now that the smallest failing case
        //   to look for is >= 5
        // * Same thing when we shrink 6 in path 8 > 6
        // * When we shrink 7 in path 8 > 7
        //   we already now that 6 passed so we now that the smallest failing case
        //   to look for is >= 7
      });
      it('Should shrink strictly positive value for range not including zero', () => {
        // Arrange
        const arb = integer({ min: 10, max: 20 });

        // Act
        const tree = buildShrinkTree(arb.contextualShrinkableFor(18));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        //   As the range [10, 20] and the value 18
        //   are just offset by +10 compared to the first case,
        //   the rendered tree will be offset by 10 too
        expect(renderedTree).toMatchInlineSnapshot(`
          "18
          ├> 10
          ├> 14
          |  ├> 12
          |  |  └> 11
          |  |     └> 10
          |  └> 13
          |     └> 12
          |        ├> 10
          |        └> 11
          |           └> 10
          ├> 16
          |  └> 15
          |     └> 14
          |        ├> 10
          |        ├> 12
          |        |  └> 11
          |        |     └> 10
          |        └> 13
          |           └> 12
          |              ├> 10
          |              └> 11
          |                 └> 10
          └> 17
             └> 16
                ├> 10
                ├> 13
                |  └> 12
                |     └> 11
                |        └> 10
                └> 15
                   └> 14
                      └> 13
                         ├> 10
                         └> 12
                            └> 11
                               └> 10"
        `);
      });
      it('Should shrink strictly negative value for negative range including zero', () => {
        // Arrange
        const arb = integer({ min: -10, max: 0 });

        // Act
        const tree = buildShrinkTree(arb.contextualShrinkableFor(-8));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        //   As the range [-10, 0] and the value -8
        //   are the opposite of first case, the rendered tree will be the same except
        //   it contains opposite values
        expect(renderedTree).toMatchInlineSnapshot(`
          "-8
          ├> 0
          ├> -4
          |  ├> -2
          |  |  └> -1
          |  |     └> 0
          |  └> -3
          |     └> -2
          |        ├> 0
          |        └> -1
          |           └> 0
          ├> -6
          |  └> -5
          |     └> -4
          |        ├> 0
          |        ├> -2
          |        |  └> -1
          |        |     └> 0
          |        └> -3
          |           └> -2
          |              ├> 0
          |              └> -1
          |                 └> 0
          └> -7
             └> -6
                ├> 0
                ├> -3
                |  └> -2
                |     └> -1
                |        └> 0
                └> -5
                   └> -4
                      └> -3
                         ├> 0
                         └> -2
                            └> -1
                               └> 0"
        `);
      });
    });

    describe('shrinkableFor', () => {
      // shrinkableFor is the legacy version of contextualShrinkableFor.
      // It only takes a context telling if we already shrunk once or not.
      // It proves too slow for deep shrink scenarios, thus contextualShrinkableFor
      // took its place for faster shrinker.

      it('Should shrink strictly positive value for positive range including zero', () => {
        // Arrange
        const arb = integer({ min: 0, max: 7 });

        // Act
        const tree = buildShrinkTree(arb.shrinkableFor(6));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        expect(renderedTree).toMatchInlineSnapshot(`
          "6
          ├> 0
          ├> 3
          |  └> 2
          |     └> 1
          |        └> 0
          └> 5
             ├> 3
             |  └> 2
             |     └> 1
             |        └> 0
             └> 4
                ├> 2
                |  └> 1
                |     └> 0
                └> 3
                   └> 2
                      └> 1
                         └> 0"
        `);
      });
      it('Should shrink strictly positive value for range not including zero', () => {
        // Arrange
        const arb = integer({ min: 2, max: 9 });

        // Act
        const tree = buildShrinkTree(arb.shrinkableFor(8));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        expect(renderedTree).toMatchInlineSnapshot(`
          "8
          ├> 2
          ├> 5
          |  └> 4
          |     └> 3
          |        └> 2
          └> 7
             ├> 5
             |  └> 4
             |     └> 3
             |        └> 2
             └> 6
                ├> 4
                |  └> 3
                |     └> 2
                └> 5
                   └> 4
                      └> 3
                         └> 2"
        `);
      });
      it('Should shrink strictly negative value for negative range including zero', () => {
        // Arrange
        const arb = integer({ min: -7, max: 0 });

        // Act
        const tree = buildShrinkTree(arb.shrinkableFor(-6));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        expect(renderedTree).toMatchInlineSnapshot(`
          "-6
          ├> 0
          ├> -3
          |  └> -2
          |     └> -1
          |        └> 0
          └> -5
             ├> -3
             |  └> -2
             |     └> -1
             |        └> 0
             └> -4
                ├> -2
                |  └> -1
                |     └> 0
                └> -3
                   └> -2
                      └> -1
                         └> 0"
        `);
      });
    });
  });
  describe('maxSafeInteger', () => {
    describe('Given no constraints [between MIN_SAFE_INTEGER and MAX_SAFE_INTEGER]', () => {
      genericHelper.isValidArbitrary(() => maxSafeInteger(), {
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number) =>
          typeof g === 'number' && g >= Number.MIN_SAFE_INTEGER && g <= Number.MAX_SAFE_INTEGER,
      });
    });
  });
  describe('nat', () => {
    it('Should throw when the number is less than 0', () =>
      fc.assert(
        fc.property(fc.integer(Number.MIN_SAFE_INTEGER, -1), (n) => {
          expect(() => nat(n)).toThrowError();
        })
      ));
    describe('Given no constraints [between 0 and 2**31 -1]', () => {
      genericHelper.isValidArbitrary(() => nat(), {
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number) => typeof g === 'number' && g >= 0 && g <= 0x7fffffff,
      });
    });
    describe('Given maximal value only [between 0 and max]', () => {
      genericHelper.isValidArbitrary((maxValue: number) => nat(maxValue), {
        seedGenerator: fc.nat(),
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number, maxValue: number) => typeof g === 'number' && g >= 0 && g <= maxValue,
      });
    });
    describe('Still support older signatures', () => {
      it('Should support fc.nat(max)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.nat(), (seed, max) => {
            const refArbitrary = nat({ max });
            const otherArbitrary = nat(max);
            expect(generateOneValue(seed, otherArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
    });
  });
  describe('maxSafeNat', () => {
    describe('Given no constraints [between 0 and MAX_SAFE_INTEGER]', () => {
      genericHelper.isValidArbitrary(() => maxSafeNat(), {
        isStrictlySmallerValue: isStrictlySmallerInteger,
        isValidValue: (g: number) => typeof g === 'number' && g >= 0 && g <= Number.MAX_SAFE_INTEGER,
      });
    });
  });
});
