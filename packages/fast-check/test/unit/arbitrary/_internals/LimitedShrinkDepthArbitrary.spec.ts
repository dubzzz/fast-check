import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';

import { declareCleaningHooksForSpies } from '../__test-helpers__/SpyCleaner';
import { fakeArbitrary } from '../__test-helpers__/ArbitraryHelpers';
import { LimitedShrinkDepthArbitrary } from '../../../../src/arbitrary/_internals/LimitedShrinkDepthArbitrary';

describe('LimitedShrinkDepthArbitrary', () => {
  declareCleaningHooksForSpies();

  describe('generate', () => {
    it('should only rely on the underlying arbitrary to generate values and forward the target value as-is', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          fc.anything(),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          (generatedValue, context, biasFactor, maxDepth) => {
            // Arrange
            const value = new Value(generatedValue, context);
            const { instance: mrng } = fakeRandom();
            const { instance: arbitrary, generate } = fakeArbitrary();
            generate.mockReturnValueOnce(value);

            // Act
            const arb = new LimitedShrinkDepthArbitrary(arbitrary, maxDepth);
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
          const arb = new LimitedShrinkDepthArbitrary(arbitrary, maxShrinksPerLevel);
          const out = arb.canShrinkWithoutContext(assessedValue);

          // Assert
          expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
          expect(canShrinkWithoutContext).toHaveBeenCalledWith(assessedValue);
          expect(out).toBe(expectedOutput);
        }),
      );
    });
  });

  describe('shrink', () => {});
});

// TODO: As this Arbitrary is playing with mapping passed values we have to confirm it behaves well for cloneable values
