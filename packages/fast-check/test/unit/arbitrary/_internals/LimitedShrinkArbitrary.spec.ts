import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { Stream } from '../../../../src/stream/Stream';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';

import { declareCleaningHooksForSpies } from '../__test-helpers__/SpyCleaner';
import { fakeArbitrary } from '../__test-helpers__/ArbitraryHelpers';
import { LimitedShrinkArbitrary } from '../../../../src/arbitrary/_internals/LimitedShrinkArbitrary';
import { IntegerArbitrary } from '../../../../src/arbitrary/_internals/IntegerArbitrary';
import {
  assertProduceSameValueGivenSameSeed,
  assertShrinkProducesSameValueWithoutInitialContext,
} from '../__test-helpers__/ArbitraryAssertions';
import { buildShrinkTree, renderTree } from '../__test-helpers__/ShrinkTree';

describe('LimitedShrinkArbitrary', () => {
  declareCleaningHooksForSpies();

  describe('generate', () => {
    it('should only rely on the underlying arbitrary to generate values and forward the target value as-is', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          fc.anything(),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          (generatedValue, context, biasFactor, maxShrinks) => {
            // Arrange
            const value = new Value(generatedValue, context);
            const { instance: mrng } = fakeRandom();
            const { instance: arbitrary, generate } = fakeArbitrary();
            generate.mockReturnValueOnce(value);

            // Act
            const arb = new LimitedShrinkArbitrary(arbitrary, maxShrinks);
            const out = arb.generate(mrng, biasFactor);

            // Assert
            expect(generate).toHaveBeenCalledTimes(1);
            expect(generate).toHaveBeenCalledWith(mrng, biasFactor);
            expect(out.value_).toBe(generatedValue); // Remark: The instance of Value itself might be different
          },
        ),
      );
    });
  });

  describe('canShrinkWithoutContext', () => {
    it('should only rely on the underlying arbitrary to check if it can generate a value without any context', () => {
      fc.assert(
        fc.property(fc.anything(), fc.boolean(), fc.nat(), (assessedValue, expectedOutput, maxShrinksPerLevel) => {
          // Arrange
          const { instance: arbitrary, canShrinkWithoutContext } = fakeArbitrary();
          canShrinkWithoutContext.mockReturnValueOnce(expectedOutput);

          // Act
          const arb = new LimitedShrinkArbitrary(arbitrary, maxShrinksPerLevel);
          const out = arb.canShrinkWithoutContext(assessedValue);

          // Assert
          expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
          expect(canShrinkWithoutContext).toHaveBeenCalledWith(assessedValue);
          expect(out).toBe(expectedOutput);
        }),
      );
    });
  });

  describe('shrink', () => {
    it('should call shrink of the underlying arbitrary but cut it to maxShrinks when >=1 and receiving its own values of first level', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          fc.anything(),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.integer({ min: 1 }),
          fc.array(fc.tuple(fc.anything(), fc.anything())),
          (generatedValue, context, biasFactor, maxShrinks, shrunkValues) => {
            // Arrange
            const value = new Value(generatedValue, context);
            const { instance: mrng } = fakeRandom();
            const { instance: arbitrary, generate, shrink } = fakeArbitrary();
            generate.mockReturnValueOnce(value);
            shrink.mockReturnValueOnce(Stream.of(...shrunkValues.map(([value, context]) => new Value(value, context))));

            // Act
            const arb = new LimitedShrinkArbitrary(arbitrary, maxShrinks);
            const g = arb.generate(mrng, biasFactor);
            const shrinks = arb.shrink(g.value_, g.context);

            // Assert
            expect(shrink).toHaveBeenCalledTimes(1);
            expect(shrink).toHaveBeenCalledWith(generatedValue, context);
            expect([...shrinks].map((s) => s.value_)).toEqual(shrunkValues.map((s) => s[0]).slice(0, maxShrinks)); // Remark: The instance of Value itself might be different
          },
        ),
      );
    });

    it('should not call shrink of the underlying arbitrary when no shrinks even if receiving its own values', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          fc.anything(),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          (generatedValue, context, biasFactor) => {
            // Arrange
            const value = new Value(generatedValue, context);
            const { instance: mrng } = fakeRandom();
            const { instance: arbitrary, generate, shrink } = fakeArbitrary();
            generate.mockReturnValueOnce(value);

            // Act
            const arb = new LimitedShrinkArbitrary(arbitrary, 0);
            const g = arb.generate(mrng, biasFactor);
            const shrinks = arb.shrink(g.value_, g.context);

            // Assert
            expect(shrink).not.toHaveBeenCalled();
            expect([...shrinks].map((s) => s.value_)).toHaveLength(0);
          },
        ),
      );
    });

    it('should cut the shrinker to only produce at most maxShrinks shrinks whatever the shrinking path', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          fc.anything(),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat({ max: 50 }), // limiting shrink count to 50 to avoid taking hours
          fc.infiniteStream(fc.infiniteStream(fc.tuple(fc.anything(), fc.anything()))),
          fc.infiniteStream(fc.integer({ min: 1 })),
          (generatedValue, context, biasFactor, maxShrinks, shrunkValuesLevels, shrinkingPath) => {
            // Arrange
            const value = new Value(generatedValue, context);
            const { instance: mrng } = fakeRandom();
            const { instance: arbitrary, generate, shrink } = fakeArbitrary();
            generate.mockReturnValueOnce(value);
            shrink.mockImplementation((): Stream<Value<any>> => {
              const itShrinks = shrunkValuesLevels.next();
              if (itShrinks.done) {
                throw new Error('Not possible, only added for typings');
              }
              return new Stream(itShrinks.value.map(([value, context]) => new Value(value, context)));
            });

            // Act / Assert
            const arb = new LimitedShrinkArbitrary(arbitrary, maxShrinks);
            const g = arb.generate(mrng, biasFactor);
            let done = false;
            let shrinkCount = 0;
            let lastValue = g;
            while (!done) {
              // Shrinking the value until we reach an end
              const shrinkLength: number = shrinkingPath.next().value;
              const shrinks = arb.shrink(lastValue.value_, lastValue.context);
              for (let i = 0; i !== shrinkLength; ++i) {
                const nextShrink = shrinks.next();
                if (nextShrink.done) {
                  done = true;
                  break;
                }
                ++shrinkCount;
                lastValue = nextShrink.value;
              }
            }
            expect(shrinkCount).toBe(maxShrinks); // exact as our underlying arbitrary is shrinking forever
          },
        ),
      );
    });
  });
});

describe('LimitedShrinkArbitrary (integration)', () => {
  type Extra = { maxShrinks: number };
  const extraParameters: fc.Arbitrary<Extra> = fc.record({ maxShrinks: fc.nat() });

  const limitedShrinkBuilder = (extra: Extra) =>
    new LimitedShrinkArbitrary(new IntegerArbitrary(0, 0x7fffffff), extra.maxShrinks);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(limitedShrinkBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(limitedShrinkBuilder, { extraParameters });
  });

  it.each`
    rawValue | maxShrinks
    ${251}   | ${0}
    ${251}   | ${1}
    ${251}   | ${2}
    ${251}   | ${3}
    ${251}   | ${4}
  `('should be able to shrink $rawValue given constraints maxShrinks:$maxShrinks', ({ rawValue, maxShrinks }) => {
    // Arrange
    const arb = new LimitedShrinkArbitrary(new IntegerArbitrary(0, 0x7fffffff), maxShrinks);
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});
