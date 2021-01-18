import * as fc from '../../../../lib/fast-check';

import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { integer, nat, maxSafeNat, maxSafeInteger } from '../../../../src/check/arbitrary/IntegerArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';
import { generateOneValue } from './generic/GenerateOneValue';
import { ArbitraryWithShrink } from '../../../../src/check/arbitrary/definition/ArbitraryWithShrink';

const isStrictlySmallerInteger = (v1: number, v2: number) => Math.abs(v1) < Math.abs(v2);

type ShrinkTree<T> = [T, ShrinkTree<T>[]];
function buildShrinkTree(s: Shrinkable<number, number>): ShrinkTree<number> {
  return [s.value_, [...s.shrink().map((ss) => buildShrinkTree(ss))]];
}
function buildShrinkTreeWithShrunkOnce(
  arb: ArbitraryWithShrink<number>,
  value: number,
  shrunkOnce = false
): ShrinkTree<number> {
  return [
    value,
    [
      ...arb
        .shrinkableFor(value, shrunkOnce)
        .shrink()
        .map((ss) => buildShrinkTreeWithShrunkOnce(arb, ss.value_, true)),
    ],
  ];
}
function renderTree(tree: ShrinkTree<number>): string[] {
  const [current, subTrees] = tree;
  const lines = [fc.stringify(current)];
  for (let index = 0; index !== subTrees.length; ++index) {
    const subTree = subTrees[index];
    const isLastSubTree = index === subTrees.length - 1;
    const firstPrefix = isLastSubTree ? '└> ' : '├> ';
    const otherPrefix = isLastSubTree ? '   ' : '|  ';
    const subRender = renderTree(subTree);
    for (let renderedIndex = 0; renderedIndex !== subRender.length; ++renderedIndex) {
      if (renderedIndex === 0) {
        lines.push(`${firstPrefix}${subRender[renderedIndex]}`);
      } else {
        lines.push(`${otherPrefix}${subRender[renderedIndex]}`);
      }
    }
  }
  return lines;
}

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
        const arb = integer({ min: 0, max: 10 });

        const tree = buildShrinkTree(arb.contextualShrinkableFor(8));

        // prettier-ignore
        expect(renderTree(tree).join('\n')).toBe(
          '8\n' + 
          '├> 0\n' + 
          '├> 4\n' + 
          '|  ├> 2\n' + 
          '|  |  └> 1\n' + 
          '|  |     └> 0\n' + // Last try...
          '|  └> 3\n' + 
          '|     └> 2\n' + // Last try...
          '|        ├> 0\n' + 
          '|        └> 1\n' + 
          '|           └> 0\n' + // Last try...
          '├> 6\n' + 
          '|  └> 5\n' + 
          '|     └> 4\n' + // Last try...
          '|        ├> 0\n' + 
          '|        ├> 2\n' + 
          '|        |  └> 1\n' + 
          '|        |     └> 0\n' + // Last try...
          '|        └> 3\n' + 
          '|           └> 2\n' + // Last try...
          '|              ├> 0\n' + 
          '|              └> 1\n' + 
          '|                 └> 0\n' + // Last try...
          '└> 7\n' + 
          '   └> 6\n' + // Last try...
          '      ├> 0\n' + 
          '      ├> 3\n' + 
          '      |  └> 2\n' + 
          '      |     └> 1\n' + 
          '      |        └> 0\n' + // Last try...
          '      └> 5\n' + 
          '         └> 4\n' + 
          '            └> 3\n' + // Last try...
          '               ├> 0\n' + 
          '               └> 2\n' + 
          '                  └> 1\n' + 
          '                     └> 0' // Last try...
        );
        // prettier-ignore-end

        // Remarks:
        // * When we shrink 5 in path 8 > 6 > 5
        //   we already now that 4 passed so we now that the smallest failing case
        //   to look for is >= 5
        // * Same thing when we shrink 6 in path 8 > 6
        // * When we shrink 7 in path 8 > 7
        //   we already now that 6 passed so we now that the smallest failing case
        //   to look for is >= 7
        // * "Last try" are used to retry a small move right after all other arbitraries ended.
        //   It tries to confirm that what we thought to be the minimal failing case is still
        //   the minimal one given the change that occurred around it
      });
      it('Should shrink strictly positive value for range not included zero', () => {
        const arb = integer({ min: 10, max: 20 });

        const tree = buildShrinkTree(arb.contextualShrinkableFor(18));

        // prettier-ignore
        // Same as first case but offset by +10 (as other values)
        expect(renderTree(tree).join('\n')).toBe(
          '18\n' + 
          '├> 10\n' + 
          '├> 14\n' + 
          '|  ├> 12\n' + 
          '|  |  └> 11\n' + 
          '|  |     └> 10\n' + // Last try...
          '|  └> 13\n' + 
          '|     └> 12\n' + // Last try...
          '|        ├> 10\n' + 
          '|        └> 11\n' + 
          '|           └> 10\n' + // Last try...
          '├> 16\n' + 
          '|  └> 15\n' + 
          '|     └> 14\n' + // Last try...
          '|        ├> 10\n' + 
          '|        ├> 12\n' + 
          '|        |  └> 11\n' + 
          '|        |     └> 10\n' + // Last try...
          '|        └> 13\n' + 
          '|           └> 12\n' + // Last try...
          '|              ├> 10\n' + 
          '|              └> 11\n' + 
          '|                 └> 10\n' + // Last try...
          '└> 17\n' + 
          '   └> 16\n' + // Last try...
          '      ├> 10\n' + 
          '      ├> 13\n' + 
          '      |  └> 12\n' + 
          '      |     └> 11\n' + 
          '      |        └> 10\n' + // Last try...
          '      └> 15\n' + 
          '         └> 14\n' + 
          '            └> 13\n' + // Last try...
          '               ├> 10\n' + 
          '               └> 12\n' + 
          '                  └> 11\n' + 
          '                     └> 10' // Last try...
        );
        // prettier-ignore-end
      });
      it('Should shrink strictly negative value for negative range including zero', () => {
        const arb = integer({ min: -10, max: 0 });

        const tree = buildShrinkTree(arb.contextualShrinkableFor(-8));

        // prettier-ignore
        // Same as first case but multiplied by -1
        expect(renderTree(tree).join('\n')).toBe(
          '-8\n' + 
          '├> 0\n' + 
          '├> -4\n' + 
          '|  ├> -2\n' + 
          '|  |  └> -1\n' + 
          '|  |     └> 0\n' + // Last try...
          '|  └> -3\n' + 
          '|     └> -2\n' + // Last try...
          '|        ├> 0\n' + 
          '|        └> -1\n' + 
          '|           └> 0\n' + // Last try...
          '├> -6\n' + 
          '|  └> -5\n' + 
          '|     └> -4\n' + // Last try...
          '|        ├> 0\n' + 
          '|        ├> -2\n' + 
          '|        |  └> -1\n' + 
          '|        |     └> 0\n' + // Last try...
          '|        └> -3\n' + 
          '|           └> -2\n' + // Last try...
          '|              ├> 0\n' + 
          '|              └> -1\n' + 
          '|                 └> 0\n' + // Last try...
          '└> -7\n' + 
          '   └> -6\n' + // Last try...
          '      ├> 0\n' + 
          '      ├> -3\n' + 
          '      |  └> -2\n' + 
          '      |     └> -1\n' + 
          '      |        └> 0\n' + // Last try...
          '      └> -5\n' + 
          '         └> -4\n' + 
          '            └> -3\n' + // Last try...
          '               ├> 0\n' + 
          '               └> -2\n' + 
          '                  └> -1\n' + 
          '                     └> 0' // Last try...
        );
        // prettier-ignore-end
      });
    });

    describe('shrinkableFor', () => {
      // shrinkableFor is the legacy version of contextualShrinkableFor.
      // It only takes a context telling if we already shrunk once or not.
      // It proves too slow for deep shrink scenarios, thus contextualShrinkableFor
      // took its place for faster shrinker.

      it('Should shrink strictly positive value for positive range including zero', () => {
        const arb = integer({ min: 0, max: 7 });

        const tree = buildShrinkTreeWithShrunkOnce(arb, 6);

        // prettier-ignore
        expect(renderTree(tree).join('\n')).toBe(
          '6\n' + 
          '├> 0\n' + 
          '├> 3\n' + 
          '|  └> 2\n' + 
          '|     └> 1\n' + 
          '|        └> 0\n' + // Last try...
          '└> 5\n' + 
          '   ├> 3\n' + 
          '   |  └> 2\n' + 
          '   |     └> 1\n' + 
          '   |        └> 0\n' + // Last try...
          '   └> 4\n' + 
          '      ├> 2\n' + 
          '      |  └> 1\n' + 
          '      |     └> 0\n' + // Last try...
          '      └> 3\n' + 
          '         └> 2\n' + 
          '            └> 1\n' +
          '               └> 0' // Last try...
        );
        // prettier-ignore-end
      });
      it('Should shrink strictly positive value for range not included zero', () => {
        const arb = integer({ min: 2, max: 9 });

        const tree = buildShrinkTreeWithShrunkOnce(arb, 8);

        // prettier-ignore
        expect(renderTree(tree).join('\n')).toBe(
          '8\n' + 
          '├> 2\n' + 
          '├> 5\n' + 
          '|  └> 4\n' + 
          '|     └> 3\n' + 
          '|        └> 2\n' + // Last try...
          '└> 7\n' + 
          '   ├> 5\n' + 
          '   |  └> 4\n' + 
          '   |     └> 3\n' + 
          '   |        └> 2\n' + // Last try...
          '   └> 6\n' + 
          '      ├> 4\n' + 
          '      |  └> 3\n' + 
          '      |     └> 2\n' + // Last try...
          '      └> 5\n' + 
          '         └> 4\n' + 
          '            └> 3\n' + 
          '               └> 2' // Last try...
        );
        // prettier-ignore-end
      });
      it('Should shrink strictly negative value for negative range including zero', () => {
        const arb = integer({ min: -7, max: 0 });

        const tree = buildShrinkTreeWithShrunkOnce(arb, -6);

        // prettier-ignore
        expect(renderTree(tree).join('\n')).toBe(
          '-6\n' + 
          '├> 0\n' + 
          '├> -3\n' + 
          '|  └> -2\n' + 
          '|     └> -1\n' +
          '|        └> 0\n' + // Last try...
          '└> -5\n' + 
          '   ├> -3\n' + 
          '   |  └> -2\n' + 
          '   |     └> -1\n' + 
          '   |        └> 0\n' + // Last try...
          '   └> -4\n' + 
          '      ├> -2\n' + 
          '      |  └> -1\n' + 
          '      |     └> 0\n' + // Last try...
          '      └> -3\n' + 
          '         └> -2\n' + 
          '            └> -1\n' + 
          '               └> 0' // Last try...
        );
        // prettier-ignore-end
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
