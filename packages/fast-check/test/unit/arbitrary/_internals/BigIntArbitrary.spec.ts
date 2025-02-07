import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { BigIntArbitrary } from '../../../../src/arbitrary/_internals/BigIntArbitrary';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertProduceCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
  assertProduceSameValueGivenSameSeed,
} from '../__test-helpers__/ArbitraryAssertions';
import { buildShrinkTree, renderTree, walkTree } from '../__test-helpers__/ShrinkTree';
import { Stream } from '../../../../src/stream/Stream';

import * as BiasNumericRangeMock from '../../../../src/arbitrary/_internals/helpers/BiasNumericRange';
import * as ShrinkBigIntMock from '../../../../src/arbitrary/_internals/helpers/ShrinkBigInt';
import { declareCleaningHooksForSpies } from '../__test-helpers__/SpyCleaner';

describe('BigIntArbitrary', () => {
  declareCleaningHooksForSpies();

  describe('generate', () => {
    it('should never bias and generate the full range when biasFactor is not specified', () =>
      fc.assert(
        fc.property(fc.bigInt(), fc.bigInt(), fc.bigInt(), (a, b, c) => {
          // Arrange
          const [min, mid, max] = [a, b, c].sort((v1, v2) => Number(v1 - v2));
          const { instance: mrng, nextBigInt } = fakeRandom();
          nextBigInt.mockReturnValueOnce(mid);

          // Act
          const arb = new BigIntArbitrary(min, max);
          const out = arb.generate(mrng, undefined);

          // Assert
          expect(out.value).toBe(mid);
          expect(nextBigInt).toHaveBeenCalledTimes(1);
          expect(nextBigInt).toHaveBeenCalledWith(min, max);
        }),
      ));

    it('should not always bias values (expect 1 times over biasFreq) and still generate full range when unbiased', () =>
      fc.assert(
        fc.property(fc.bigInt(), fc.bigInt(), fc.bigInt(), fc.maxSafeInteger(), (a, b, c, biasFactor) => {
          // Arrange
          const [min, mid, max] = [a, b, c].sort((v1, v2) => Number(v1 - v2));
          const { instance: mrng, nextInt, nextBigInt } = fakeRandom();
          nextInt.mockReturnValueOnce(2); // 1 means bias, all others are unbiased
          nextBigInt.mockReturnValueOnce(mid);

          // Act
          const arb = new BigIntArbitrary(min, max);
          const out = arb.generate(mrng, biasFactor);

          // Assert
          expect(out.value).toBe(mid);
          expect(nextInt).toHaveBeenCalledTimes(1);
          expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
          expect(nextBigInt).toHaveBeenCalledTimes(1);
          expect(nextBigInt).toHaveBeenCalledWith(min, max);
        }),
      ));

    it('should bias values (1 times over biasFreq) by using one of the ranges from biasNumericRange', () =>
      fc.assert(
        fc.property(
          fc.bigInt(),
          fc.bigInt(),
          fc.bigInt(),
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          // Remark:
          // Following biasNumericRange is not fully identical to the onces that would be provided.
          // Range (in this stub) can be larger than the requested one. Not impacting from a unit-test point of view.
          fc.array(
            fc.tuple(fc.bigInt(), fc.bigInt()).map(([a, b]) => (a < b ? { min: a, max: b } : { min: b, max: a })),
            { minLength: 1 },
          ),
          (a, b, c, biasFactor, mod, ranges) => {
            // Arrange
            const [min, mid, max] = [a, b, c].sort((v1, v2) => Number(v1 - v2));
            const { instance: mrng, nextInt, nextBigInt } = fakeRandom();
            nextInt.mockReturnValueOnce(1); // 1 means bias
            if (ranges.length !== 1) {
              nextInt.mockImplementationOnce((min, max) => min + (mod % (max - min + 1)));
            }
            nextBigInt.mockReturnValueOnce(mid); // Remark: this value will most of the time be outside of requested range
            const biasNumericRange = vi.spyOn(BiasNumericRangeMock, 'biasNumericRange');
            biasNumericRange.mockReturnValueOnce(ranges);

            // Act
            const arb = new BigIntArbitrary(min, max);
            const out = arb.generate(mrng, biasFactor);

            // Assert
            expect(out.value).toBe(mid);
            expect(biasNumericRange).toHaveBeenCalledTimes(1);
            expect(biasNumericRange).toHaveBeenCalledWith(min, max, expect.any(Function));
            if (ranges.length === 1) {
              expect(nextInt).toHaveBeenCalledTimes(1);
              expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
              expect(nextBigInt).toHaveBeenCalledTimes(1);
              expect(nextBigInt).toHaveBeenCalledWith(ranges[0].min, ranges[0].max);
            } else {
              expect(nextInt).toHaveBeenCalledTimes(2);
              expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
              const secondNextIntParams = nextInt.mock.calls[1];
              expect(secondNextIntParams[0]).toBeLessThan(0); // arbitrary is supposed to prefer the first entry
              expect(secondNextIntParams[1]).toBe(ranges.length - 2); // other entries do not have any special treatments
              // negative values for [0], positive value n means ranges[n+1]
              const secondNextIntResult = nextInt.mock.results[1].value;
              const selectedRange = secondNextIntResult < 0 ? 0 : secondNextIntResult + 1;
              expect(nextBigInt).toHaveBeenCalledWith(ranges[selectedRange].min, ranges[selectedRange].max);
            }
          },
        ),
      ));
  });

  describe('canShrinkWithoutContext', () => {
    it('should always tells it can generate values included in the requested range', () =>
      fc.assert(
        fc.property(fc.bigInt(), fc.bigInt(), fc.bigInt(), (a, b, c) => {
          // Arrange
          const [min, mid, max] = [a, b, c].sort((v1, v2) => Number(v1 - v2));

          // Act
          const arb = new BigIntArbitrary(min, max);
          const out = arb.canShrinkWithoutContext(mid);

          // Assert
          expect(out).toBe(true);
        }),
      ));

    it('should always reject values outside of the requested range', () =>
      fc.assert(
        fc.property(
          fc.bigInt(),
          fc.bigInt(),
          fc.bigInt(),
          fc.constantFrom(...(['lower', 'higher'] as const)),
          (a, b, c, position) => {
            // Arrange
            const s = [a, b, c].sort((v1, v2) => Number(v1 - v2));
            const [min, max, requested] = position === 'lower' ? [s[1], s[2], s[0]] : [s[0], s[1], s[2]];
            fc.pre(requested !== min && requested !== max);

            // Act
            const arb = new BigIntArbitrary(min, max);
            const out = arb.canShrinkWithoutContext(requested);

            // Assert
            expect(out).toBe(false);
          },
        ),
      ));

    it.each`
      requested
      ${'1'}
      ${1}
      ${'1n'}
      ${1.5}
      ${-0}
      ${Number.NaN}
      ${''}
      ${{}}
    `('should always reject non bigint values like $requested', ({ requested }) => {
      // Arrange
      const min = BigInt(0);
      const max = BigInt(100);

      // Act
      const arb = new BigIntArbitrary(min, max);
      const out = arb.canShrinkWithoutContext(requested);

      // Assert
      expect(out).toBe(false);
    });
  });

  describe('shrink', () => {
    it('should always call shrink helper when no context provided', () =>
      fc.assert(
        fc.property(fc.bigInt(), fc.bigInt(), fc.bigInt(), (a, b, c) => {
          // Arrange
          const [min, mid, max] = [a, b, c].sort((v1, v2) => Number(v1 - v2));
          const expectedShrinks = Stream.nil<Value<bigint>>();
          const shrinkBigInt = vi.spyOn(ShrinkBigIntMock, 'shrinkBigInt');
          shrinkBigInt.mockReturnValueOnce(expectedShrinks);

          // Act
          const arb = new BigIntArbitrary(min, max);
          const shrinks = arb.shrink(mid, undefined);

          // Assert
          expect(shrinks).toBe(expectedShrinks);
          expect(shrinkBigInt).toHaveBeenCalledTimes(1);
          expect(shrinkBigInt).toHaveBeenCalledWith(mid, expect.any(BigInt), true);
        }),
      ));
  });
});

describe('BigIntArbitrary (integration)', () => {
  type Extra = { min: bigint; max: bigint };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(fc.bigInt(), fc.bigInt())
    .map(([a, b]) => (a < b ? { min: a, max: b } : { min: b, max: a }));

  const isCorrect = (value: bigint, extra: Extra) =>
    typeof value === 'bigint' && extra.min <= value && value <= extra.max;

  const isStrictlySmaller = (v1: bigint, v2: bigint) => {
    const absV1 = v1 < BigInt(0) ? -v1 : v1;
    const absV2 = v2 < BigInt(0) ? -v2 : v2;
    return absV1 < absV2;
  };

  const bigIntBuilder = (extra: Extra) => new BigIntArbitrary(extra.min, extra.max);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(bigIntBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(bigIntBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(bigIntBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(bigIntBuilder, { extraParameters });
  });

  it('should shrink towards strictly smaller values', () => {
    assertShrinkProducesStrictlySmallerValue(bigIntBuilder, isStrictlySmaller, { extraParameters });
  });

  describe('shrink', () => {
    it('should build a mirrored version of the shrinking tree if we negate all the values', () =>
      fc.assert(
        fc.property(
          fc.bigInt(),
          fc.bigInt({ min: BigInt(0), max: BigInt(20) }), // larger trees might be too wide
          fc.bigInt({ min: BigInt(0), max: BigInt(20) }),
          (start, o1, o2) => {
            // Arrange
            const min = start;
            const [mid, max] = o1 < o2 ? [min + o1, min + o2] : [min + o2, min + o1];
            const arb = new BigIntArbitrary(min, max);
            const arbNegate = new BigIntArbitrary(-max, -min);

            // Act
            const source = new Value(mid, undefined);
            const sourceNegate = new Value(-mid, undefined);
            const tree = buildShrinkTree(arb, source);
            const treeNegate = buildShrinkTree(arbNegate, sourceNegate);
            const flat: bigint[] = [];
            const flatNegate: bigint[] = [];
            walkTree(tree, (v) => flat.push(v));
            walkTree(treeNegate, (v) => flatNegate.push(-v));

            // Assert
            expect(arb.canShrinkWithoutContext(source.value)).toBe(true);
            expect(arbNegate.canShrinkWithoutContext(sourceNegate.value)).toBe(true);
            expect(flatNegate).toEqual(flat);
          },
        ),
      ));

    it('should build an offset version of the shrinking tree if we offset all the values (keep every value >=0)', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: BigInt(0) }),
          fc.bigInt({ min: BigInt(0), max: BigInt(20) }), // larger trees might be too wide
          fc.bigInt({ min: BigInt(0), max: BigInt(20) }),
          fc.bigInt({ min: BigInt(0) }),
          (start, o1, o2, offset) => {
            // Arrange
            fc.pre(start + o1 + offset <= Number.MAX_SAFE_INTEGER);
            fc.pre(start + o2 + offset <= Number.MAX_SAFE_INTEGER);
            const min = start;
            const [mid, max] = o1 < o2 ? [min + o1, min + o2] : [min + o2, min + o1];
            const arb = new BigIntArbitrary(min, max);
            const arbOffset = new BigIntArbitrary(min + offset, max + offset);

            // Act
            const source = new Value(mid, undefined);
            const sourceOffset = new Value(mid + offset, undefined);
            const tree = buildShrinkTree(arb, source);
            const treeOffset = buildShrinkTree(arbOffset, sourceOffset);
            const flat: bigint[] = [];
            const flatOffset: bigint[] = [];
            walkTree(tree, (v) => flat.push(v));
            walkTree(treeOffset, (v) => flatOffset.push(v - offset));

            // Assert
            expect(arb.canShrinkWithoutContext(source.value)).toBe(true);
            expect(arbOffset.canShrinkWithoutContext(sourceOffset.value)).toBe(true);
            expect(flatOffset).toEqual(flat);
          },
        ),
      ));

    it('should shrink strictly positive value for positive range including zero', () => {
      // Arrange
      const arb = new BigIntArbitrary(BigInt(0), BigInt(10));
      const source = new Value(BigInt(8), undefined);

      // Act
      const tree = buildShrinkTree(arb, source);
      const renderedTree = renderTree(tree).join('\n');

      // Assert
      expect(arb.canShrinkWithoutContext(source.value)).toBe(true);
      //   When there is no more option, the shrinker retry one time with the value
      //   current-1 to check if something that changed outside (another value not itself)
      //   may have changed the situation.
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

      // Remarks:
      // * When we shrink 5 in path 8 > 6 > 5
      //   we already now that 4 passed so we now that the smallest failing case
      //   to look for is >= 5
      // * Same thing when we shrink 6 in path 8 > 6
      // * When we shrink 7 in path 8 > 7
      //   we already now that 6 passed so we now that the smallest failing case
      //   to look for is >= 7
    });

    it('should shrink strictly positive value for range not including zero', () => {
      // Arrange
      const arb = new BigIntArbitrary(BigInt(10), BigInt(20));
      const source = new Value(BigInt(18), undefined);

      // Act
      const tree = buildShrinkTree(arb, source);
      const renderedTree = renderTree(tree).join('\n');

      // Assert
      expect(arb.canShrinkWithoutContext(source.value)).toBe(true);
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

    it('should shrink strictly negative value for negative range including zero', () => {
      // Arrange
      const arb = new BigIntArbitrary(BigInt(-10), BigInt(0));
      const source = new Value(BigInt(-8), undefined);

      // Act
      const tree = buildShrinkTree(arb, source);
      const renderedTree = renderTree(tree).join('\n');

      // Assert
      expect(arb.canShrinkWithoutContext(source.value)).toBe(true);
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
