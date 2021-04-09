import * as fc from '../../../../lib/fast-check';
import { IntegerArbitrary } from '../../../../src/arbitrary/_internals/IntegerArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { fakeRandom } from '../../check/arbitrary/generic/RandomHelpers';
import {
  assertGenerateProducesCorrectValues,
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../../check/arbitrary/generic/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree, walkTree } from '../../check/arbitrary/generic/ShrinkTree';

import * as BiasNumericRangeMock from '../../../../src/arbitrary/_internals/helpers/BiasNumericRange';
import * as ShrinkIntegerMock from '../../../../src/arbitrary/_internals/helpers/ShrinkInteger';
import { Stream } from '../../../../src/stream/Stream';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('IntegerArbitrary', () => {
  describe('generate', () => {
    it('should never bias and generate the full range when biasFactor is not specified', () =>
      fc.assert(
        fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), fc.maxSafeInteger(), (a, b, c) => {
          // Arrange
          const [min, mid, max] = [a, b, c].sort((v1, v2) => v1 - v2);
          const { instance: mrng, nextInt } = fakeRandom();
          nextInt.mockReturnValueOnce(mid);

          // Act
          const arb = new IntegerArbitrary(min, max);
          const out = arb.generate(mrng, undefined);

          // Assert
          expect(out.value).toBe(mid);
          expect(nextInt).toHaveBeenCalledTimes(1);
          expect(nextInt).toHaveBeenCalledWith(min, max);
        })
      ));

    it('should not always bias values (expect 1 times over biasFreq) and still generate full range when unbiased', () =>
      fc.assert(
        fc.property(
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          (a, b, c, biasFactor) => {
            // Arrange
            const [min, mid, max] = [a, b, c].sort((v1, v2) => v1 - v2);
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockReturnValueOnce(2); // 1 means bias, all others are unbiased
            nextInt.mockReturnValueOnce(mid);

            // Act
            const arb = new IntegerArbitrary(min, max);
            const out = arb.generate(mrng, biasFactor);

            // Assert
            expect(out.value).toBe(mid);
            expect(nextInt).toHaveBeenCalledTimes(2);
            expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
            expect(nextInt).toHaveBeenCalledWith(min, max);
          }
        )
      ));

    it('should bias values (1 times over biasFreq) by using one of the ranges from biasNumericRange', () =>
      fc.assert(
        fc.property(
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          // Remark:
          // Following biasNumericRange is not fully identical to the onces that would be provided.
          // Range (in this stub) can be larger than the requested one. Not impacting from a unit-test point of view.
          fc.array(
            fc
              .tuple(fc.maxSafeInteger(), fc.maxSafeInteger())
              .map(([a, b]) => (a < b ? { min: a, max: b } : { min: b, max: a })),
            { minLength: 1 }
          ),
          (a, b, c, biasFactor, mod, ranges) => {
            // Arrange
            const [min, mid, max] = [a, b, c].sort((v1, v2) => v1 - v2);
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockReturnValueOnce(1); // 1 means bias
            if (ranges.length !== 1) {
              nextInt.mockImplementationOnce((min, max) => min + (mod % (max - min + 1)));
            }
            nextInt.mockReturnValueOnce(mid); // Remark: this value will most of the time be outside of requested range
            const biasNumericRange = (jest.spyOn(
              BiasNumericRangeMock,
              'biasNumericRange'
            ) as unknown) as jest.SpyInstance<{ min: number; max: number }[], [number, number, () => number]>;
            biasNumericRange.mockReturnValueOnce(ranges);

            // Act
            const arb = new IntegerArbitrary(min, max);
            const out = arb.generate(mrng, biasFactor);

            // Assert
            expect(out.value).toBe(mid);
            expect(biasNumericRange).toHaveBeenCalledTimes(1);
            expect(biasNumericRange).toHaveBeenCalledWith(min, max, expect.any(Function));
            if (ranges.length === 1) {
              expect(nextInt).toHaveBeenCalledTimes(2);
              expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
              expect(nextInt).toHaveBeenCalledWith(ranges[0].min, ranges[0].max);
            } else {
              expect(nextInt).toHaveBeenCalledTimes(3);
              expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
              const secondNextIntParams = nextInt.mock.calls[1];
              expect(secondNextIntParams[0]).toBeLessThan(0); // arbitrary is supposed to prefer the first entry
              expect(secondNextIntParams[1]).toBe(ranges.length - 2); // other entries do not have any special treatments
              // negative values for [0], positive value n means ranges[n+1]
              const secondNextIntResult = nextInt.mock.results[1].value;
              const selectedRange = secondNextIntResult < 0 ? 0 : secondNextIntResult + 1;
              expect(nextInt).toHaveBeenCalledWith(ranges[selectedRange].min, ranges[selectedRange].max);
            }
          }
        )
      ));
  });

  describe('canGenerate', () => {
    it('should always tells it can generate values included in the requested range', () =>
      fc.assert(
        fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), fc.maxSafeInteger(), (a, b, c) => {
          // Arrange
          const [min, mid, max] = [a, b, c].sort((v1, v2) => v1 - v2);

          // Act
          const arb = new IntegerArbitrary(min, max);
          const out = arb.canGenerate(mid);

          // Assert
          expect(out).toBe(true);
        })
      ));

    it('should always reject values outside of the requested range', () =>
      fc.assert(
        fc.property(
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          fc.maxSafeInteger(),
          fc.constantFrom(...(['lower', 'higher'] as const)),
          (a, b, c, position) => {
            // Arrange
            const s = [a, b, c].sort((v1, v2) => v1 - v2);
            const [min, max, requested] = position === 'lower' ? [s[1], s[2], s[0]] : [s[0], s[1], s[2]];
            fc.pre(requested !== min && requested !== max);

            // Act
            const arb = new IntegerArbitrary(min, max);
            const out = arb.canGenerate(requested);

            // Assert
            expect(out).toBe(false);
          }
        )
      ));

    it.each`
      requested
      ${'1'}
      ${1.5}
      ${-0}
      ${Number.NaN}
      ${''}
      ${{}}
    `('should always reject non integral values like $requested', ({ requested }) => {
      // Arrange
      const min = 0;
      const max = 100;

      // Act
      const arb = new IntegerArbitrary(min, max);
      const out = arb.canGenerate(requested);

      // Assert
      expect(out).toBe(false);
    });
  });

  describe('shrink', () => {
    it('should always call shrink helper when no context provided', () =>
      fc.assert(
        fc.property(fc.maxSafeNat(), fc.maxSafeNat(), fc.maxSafeNat(), (a, b, c) => {
          // Arrange
          const [min, mid, max] = [a, b, c].sort((v1, v2) => v1 - v2);
          const expectedShrinks = Stream.nil<NextValue<number>>();
          const shrinkInteger = jest.spyOn(ShrinkIntegerMock, 'shrinkInteger');
          shrinkInteger.mockReturnValueOnce(expectedShrinks);

          // Act
          const arb = new IntegerArbitrary(min, max);
          const shrinks = arb.shrink(mid, undefined);

          // Assert
          expect(shrinks).toBe(expectedShrinks);
          expect(shrinkInteger).toHaveBeenCalledTimes(1);
          expect(shrinkInteger).toHaveBeenCalledWith(mid, expect.any(Number), true);
        })
      ));
  });
});

describe('IntegerArbitrary (integration)', () => {
  type Extra = { min: number; max: number };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(fc.maxSafeInteger(), fc.maxSafeInteger())
    .map(([a, b]) => (a < b ? { min: a, max: b } : { min: b, max: a }));

  const isCorrect = (value: number, extra: Extra) =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    !Object.is(value, -0) &&
    extra.min <= value &&
    value <= extra.max;

  const isStrictlySmaller = (v1: number, v2: number) => Math.abs(v1) < Math.abs(v2);

  const integerBuilder = (extra: Extra) => new IntegerArbitrary(extra.min, extra.max);

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(integerBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(integerBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(integerBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(integerBuilder, { extraParameters });
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(integerBuilder, { extraParameters });
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(integerBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(integerBuilder, { extraParameters });
  });

  it('should shrink towards strictly smaller values', () => {
    assertShrinkProducesStrictlySmallerValue(integerBuilder, isStrictlySmaller, { extraParameters });
  });

  describe('shrink', () => {
    it('should build a mirrored version of the shrinking tree if we negate all the values', () =>
      fc.assert(
        fc.property(
          fc.maxSafeInteger(),
          fc.integer({ min: 0, max: 20 }), // larger trees might be too wide
          fc.integer({ min: 0, max: 20 }),
          (start, o1, o2) => {
            // Arrange
            fc.pre(start + o1 <= Number.MAX_SAFE_INTEGER);
            fc.pre(start + o2 <= Number.MAX_SAFE_INTEGER);
            const min = start;
            const [mid, max] = o1 < o2 ? [min + o1, min + o2] : [min + o2, min + o1];
            const arb = new IntegerArbitrary(min, max);
            const arbNegate = new IntegerArbitrary(-max, -min);

            // Act
            const tree = buildNextShrinkTree(arb, new NextValue(mid));
            const treeNegate = buildNextShrinkTree(arbNegate, new NextValue(-mid));
            const flat: number[] = [];
            const flatNegate: number[] = [];
            walkTree(tree, (v) => flat.push(v));
            walkTree(treeNegate, (v) => flatNegate.push(v !== 0 ? -v : 0));

            // Assert
            expect(flatNegate).toEqual(flat);
          }
        )
      ));

    it('should build an offset version of the shrinking tree if we offset all the values (keep every value >=0)', () =>
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
          fc.integer({ min: 0, max: 20 }), // larger trees might be too wide
          fc.integer({ min: 0, max: 20 }),
          fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
          (start, o1, o2, offset) => {
            // Arrange
            fc.pre(start + o1 + offset <= Number.MAX_SAFE_INTEGER);
            fc.pre(start + o2 + offset <= Number.MAX_SAFE_INTEGER);
            const min = start;
            const [mid, max] = o1 < o2 ? [min + o1, min + o2] : [min + o2, min + o1];
            const arb = new IntegerArbitrary(min, max);
            const arbOffset = new IntegerArbitrary(min + offset, max + offset);

            // Act
            const tree = buildNextShrinkTree(arb, new NextValue(mid));
            const treeOffset = buildNextShrinkTree(arbOffset, new NextValue(mid + offset));
            const flat: number[] = [];
            const flatOffset: number[] = [];
            walkTree(tree, (v) => flat.push(v));
            walkTree(treeOffset, (v) => flatOffset.push(v - offset));

            // Assert
            expect(flatOffset).toEqual(flat);
          }
        )
      ));

    it('should shrink strictly positive value for positive range including zero', () => {
      // Arrange
      const arb = new IntegerArbitrary(0, 10);

      // Act
      const tree = buildNextShrinkTree(arb, new NextValue(8));
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

    it('should shrink strictly positive value for range not including zero', () => {
      // Arrange
      const arb = new IntegerArbitrary(10, 20);

      // Act
      const tree = buildNextShrinkTree(arb, new NextValue(18));
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

    it('should shrink strictly negative value for negative range including zero', () => {
      // Arrange
      const arb = new IntegerArbitrary(-10, 0);

      // Act
      const tree = buildNextShrinkTree(arb, new NextValue(-8));
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
});
