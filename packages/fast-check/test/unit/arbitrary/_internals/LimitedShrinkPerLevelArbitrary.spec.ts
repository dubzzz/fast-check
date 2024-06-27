import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';

import { declareCleaningHooksForSpies } from '../__test-helpers__/SpyCleaner';
import { fakeArbitrary } from '../__test-helpers__/ArbitraryHelpers';
import { LimitedShrinkPerLevelArbitrary } from '../../../../src/arbitrary/_internals/LimitedShrinkPerLevelArbitrary';

describe('LimitedShrinkPerLevelArbitrary', () => {
  declareCleaningHooksForSpies();

  describe('generate', () => {
    it('should only rely on the underlying arbitrary to generate values and forward them as-is without altering it', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          fc.anything(),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          (generatedValue, context, biasFactor, maxShrinksPerLevel) => {
            // Arrange
            const value = new Value(generatedValue, context);
            const { instance: mrng } = fakeRandom();
            const { instance: arbitrary, generate } = fakeArbitrary();
            generate.mockReturnValueOnce(value);

            // Act
            const arb = new LimitedShrinkPerLevelArbitrary(arbitrary, maxShrinksPerLevel);
            const out = arb.generate(mrng, biasFactor);

            // Assert
            expect(generate).toHaveBeenCalledTimes(1);
            expect(generate).toHaveBeenCalledWith(mrng, biasFactor);
            expect(out).toBe(value);
            expect(out.context).toBe(context);
            expect(out.value_).toBe(generatedValue);
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
          const arb = new LimitedShrinkPerLevelArbitrary(arbitrary, maxShrinksPerLevel);
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
