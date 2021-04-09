import * as fc from '../../../lib/fast-check';

import { bigInt } from '../../../src/arbitrary/bigInt';
import { bigIntN } from '../../../src/arbitrary/bigIntN';
import { bigUint } from '../../../src/arbitrary/bigUint';
import { bigUintN } from '../../../src/arbitrary/bigUintN';
import { generateOneValue } from '../check/arbitrary/generic/GenerateOneValue';

import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';
import { buildShrinkTree, renderTree } from '../check/arbitrary/generic/ShrinkTree';

declare function BigInt(n: number | bigint | string): bigint;

const isStrictlySmallerBigInt = (v1: bigint, v2: bigint) => {
  const posV1 = v1 >= BigInt(0) ? v1 : -v1;
  const posV2 = v2 >= BigInt(0) ? v2 : -v2;
  return posV1 < posV2;
};

describe('BigIntArbitrary', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }
  describe('bigIntN', () => {
    describe('Given number of bits N [2^(N-1) <= value < 2^(N-1)]', () => {
      genericHelper.isValidArbitrary((n: number) => bigIntN(n), {
        seedGenerator: fc.integer(1, 2000),
        isStrictlySmallerValue: isStrictlySmallerBigInt,
        isValidValue: (g: bigint, n: number) =>
          typeof g === 'bigint' && g >= BigInt(-1) << BigInt(n - 1) && g <= (BigInt(1) << BigInt(n - 1)) - BigInt(1),
      });
    });
  });
  describe('bigUintN', () => {
    describe('Given number of bits N [0 <= value < 2^N]', () => {
      genericHelper.isValidArbitrary((n: number) => bigUintN(n), {
        seedGenerator: fc.integer(1, 2000),
        isStrictlySmallerValue: isStrictlySmallerBigInt,
        isValidValue: (g: bigint, n: number) =>
          typeof g === 'bigint' && g >= BigInt(0) && g <= (BigInt(1) << BigInt(n)) - BigInt(1),
      });
    });
  });
  describe('bigInt', () => {
    describe('Given no constraints', () => {
      genericHelper.isValidArbitrary(() => bigInt(), {
        isStrictlySmallerValue: isStrictlySmallerBigInt,
        isValidValue: (g: bigint) => typeof g === 'bigint',
      });
    });
    describe('Given minimal value only [greater or equal to min]', () => {
      genericHelper.isValidArbitrary((min: bigint) => bigInt({ min }), {
        seedGenerator: fc.bigInt(),
        isStrictlySmallerValue: isStrictlySmallerBigInt,
        isValidValue: (g: bigint, min: bigint) => typeof g === 'bigint' && min <= g,
      });
    });
    describe('Given maximal value only [less or equal to max]', () => {
      genericHelper.isValidArbitrary((max: bigint) => bigInt({ max }), {
        seedGenerator: fc.bigInt(),
        isStrictlySmallerValue: isStrictlySmallerBigInt,
        isValidValue: (g: bigint, max: bigint) => typeof g === 'bigint' && g <= max,
      });
    });
    describe('Given minimal and maximal values [between min and max]', () => {
      genericHelper.isValidArbitrary((constraints: { min: bigint; max: bigint }) => bigInt(constraints), {
        seedGenerator: genericHelper.minMax(fc.bigInt()),
        isStrictlySmallerValue: isStrictlySmallerBigInt,
        isValidValue: (g: bigint, constraints: { min: bigint; max: bigint }) =>
          typeof g === 'bigint' && constraints.min <= g && g <= constraints.max,
      });
    });
    describe('Still support older signatures', () => {
      it('Should support fc.bigInt(min, max)', () => {
        fc.assert(
          fc.property(fc.integer(), genericHelper.minMax(fc.bigInt()), (seed, constraints) => {
            const refArbitrary = bigInt(constraints);
            const otherArbitrary = bigInt(constraints.min, constraints.max);
            expect(generateOneValue(seed, otherArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
    });

    describe('contextualShrinkableFor', () => {
      it('Should shrink strictly positive value for positive range including zero', () => {
        // Arrange
        const arb = bigInt({ min: BigInt(0), max: BigInt(10) });

        // Act
        const tree = buildShrinkTree(arb.contextualShrinkableFor(BigInt(8)));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        //   When there is no more option, the shrinker retry one time with the value
        //   current-1 to check if something that changed outside (another value not itself)
        //   may have changed the situation
        expect(renderedTree).toMatchInlineSnapshot(`
          "8n
          ├> 0n
          ├> 4n
          |  ├> 2n
          |  |  └> 1n
          |  |     └> 0n
          |  └> 3n
          |     └> 2n
          |        ├> 0n
          |        └> 1n
          |           └> 0n
          ├> 6n
          |  └> 5n
          |     └> 4n
          |        ├> 0n
          |        ├> 2n
          |        |  └> 1n
          |        |     └> 0n
          |        └> 3n
          |           └> 2n
          |              ├> 0n
          |              └> 1n
          |                 └> 0n
          └> 7n
             └> 6n
                ├> 0n
                ├> 3n
                |  └> 2n
                |     └> 1n
                |        └> 0n
                └> 5n
                   └> 4n
                      └> 3n
                         ├> 0n
                         └> 2n
                            └> 1n
                               └> 0n"
        `);
      });
      it('Should shrink strictly positive value for range not including zero', () => {
        // Arrange
        const arb = bigInt({ min: BigInt(10), max: BigInt(20) });

        // Act
        const tree = buildShrinkTree(arb.contextualShrinkableFor(BigInt(18)));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        //   As the range [10, 20] and the value 18
        //   are just offset by +10 compared to the first case,
        //   the rendered tree will be offset by 10 too
        expect(renderedTree).toMatchInlineSnapshot(`
          "18n
          ├> 10n
          ├> 14n
          |  ├> 12n
          |  |  └> 11n
          |  |     └> 10n
          |  └> 13n
          |     └> 12n
          |        ├> 10n
          |        └> 11n
          |           └> 10n
          ├> 16n
          |  └> 15n
          |     └> 14n
          |        ├> 10n
          |        ├> 12n
          |        |  └> 11n
          |        |     └> 10n
          |        └> 13n
          |           └> 12n
          |              ├> 10n
          |              └> 11n
          |                 └> 10n
          └> 17n
             └> 16n
                ├> 10n
                ├> 13n
                |  └> 12n
                |     └> 11n
                |        └> 10n
                └> 15n
                   └> 14n
                      └> 13n
                         ├> 10n
                         └> 12n
                            └> 11n
                               └> 10n"
        `);
      });
      it('Should shrink strictly negative value for negative range including zero', () => {
        // Arrange
        const arb = bigInt({ min: BigInt(-10), max: BigInt(0) });

        // Act
        const tree = buildShrinkTree(arb.contextualShrinkableFor(BigInt(-8)));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        //   As the range [-10, 0] and the value -8
        //   are the opposite of first case, the rendered tree will be the same except
        //   it contains opposite values
        expect(renderedTree).toMatchInlineSnapshot(`
          "-8n
          ├> 0n
          ├> -4n
          |  ├> -2n
          |  |  └> -1n
          |  |     └> 0n
          |  └> -3n
          |     └> -2n
          |        ├> 0n
          |        └> -1n
          |           └> 0n
          ├> -6n
          |  └> -5n
          |     └> -4n
          |        ├> 0n
          |        ├> -2n
          |        |  └> -1n
          |        |     └> 0n
          |        └> -3n
          |           └> -2n
          |              ├> 0n
          |              └> -1n
          |                 └> 0n
          └> -7n
             └> -6n
                ├> 0n
                ├> -3n
                |  └> -2n
                |     └> -1n
                |        └> 0n
                └> -5n
                   └> -4n
                      └> -3n
                         ├> 0n
                         └> -2n
                            └> -1n
                               └> 0n"
        `);
      });
    });
  });
  describe('bigUint', () => {
    describe('Given no constraints [positive values]', () => {
      genericHelper.isValidArbitrary(() => bigUint(), {
        isStrictlySmallerValue: isStrictlySmallerBigInt,
        isValidValue: (g: bigint) => typeof g === 'bigint' && g >= BigInt(0),
      });
    });
    describe('Given maximal value [between 0 and max]', () => {
      genericHelper.isValidArbitrary((max: bigint) => bigUint({ max }), {
        seedGenerator: fc.bigUint(),
        isStrictlySmallerValue: isStrictlySmallerBigInt,
        isValidValue: (g: bigint, max: bigint) => typeof g === 'bigint' && g >= BigInt(0) && g <= max,
      });
    });
    describe('Still support older signatures', () => {
      it('Should support fc.bigUint( max)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.bigUint(), (seed, max) => {
            const refArbitrary = bigUint({ max });
            const otherArbitrary = bigUint(max);
            expect(generateOneValue(seed, otherArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
    });
  });
});
