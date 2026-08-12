import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import type { OneOfConstraints } from './oneof.js';
import { oneof } from './oneof.js';
import { fakeArbitrary } from '../../test/unit/arbitrary/__test-helpers__/ArbitraryHelpers.js';
import * as FrequencyArbitraryMock from './_internals/FrequencyArbitrary.js';
import { sizeArb } from '../../test/unit/arbitrary/__test-helpers__/SizeHelpers.js';
import { declareCleaningHooksForSpies } from '../../test/unit/arbitrary/__test-helpers__/SpyCleaner.js';

describe('oneof', () => {
  declareCleaningHooksForSpies();

  it('should adapt received MaybeWeightedArbitrary for FrequencyArbitrary.from when called with constraints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record(
          {
            withCrossShrink: fc.boolean(),
            depthIdentifier: fc.string(),
            depthSize: fc.oneof(fc.double({ min: 0, noNaN: true }), sizeArb),
            maxDepth: fc.nat(),
          },
          { requiredKeys: [] },
        ),
        fc.option(fc.nat()),
        fc.option(fc.nat()),
        fc.option(fc.nat()),
        (constraints: Partial<OneOfConstraints>, weight1, weight2, weight3) => {
          // Arrange
          const expectedArb = fakeArbitrary().instance;
          const from = vi.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
          from.mockReturnValue(expectedArb);
          const { instance: arb1 } = fakeArbitrary();
          const { instance: arb2 } = fakeArbitrary();
          const { instance: arb3 } = fakeArbitrary();

          // Act
          const out = oneof(
            constraints,
            weight1 !== null ? { arbitrary: arb1, weight: weight1 } : arb1,
            weight2 !== null ? { arbitrary: arb2, weight: weight2 } : arb2,
            weight3 !== null ? { arbitrary: arb3, weight: weight3 } : arb3,
          );

          // Assert
          expect(from).toHaveBeenCalledWith(
            [
              { arbitrary: arb1, weight: weight1 !== null ? weight1 : 1 },
              { arbitrary: arb2, weight: weight2 !== null ? weight2 : 1 },
              { arbitrary: arb3, weight: weight3 !== null ? weight3 : 1 },
            ],
            constraints,
            'fc.oneof',
          );
          expect(out).toBe(expectedArb);
        },
      ),
    );
  });

  it('should adapt received MaybeWeightedArbitrary for FrequencyArbitrary.from when called without constraints', async () => {
    await fc.assert(
      fc.asyncProperty(fc.option(fc.nat()), fc.option(fc.nat()), fc.option(fc.nat()), (weight1, weight2, weight3) => {
        // Arrange
        const expectedArb = fakeArbitrary().instance;
        const from = vi.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
        from.mockReturnValue(expectedArb);
        const { instance: arb1 } = fakeArbitrary();
        const { instance: arb2 } = fakeArbitrary();
        const { instance: arb3 } = fakeArbitrary();

        // Act
        const out = oneof(
          weight1 !== null ? { arbitrary: arb1, weight: weight1 } : arb1,
          weight2 !== null ? { arbitrary: arb2, weight: weight2 } : arb2,
          weight3 !== null ? { arbitrary: arb3, weight: weight3 } : arb3,
        );

        // Assert
        expect(from).toHaveBeenCalledWith(
          [
            { arbitrary: arb1, weight: weight1 !== null ? weight1 : 1 },
            { arbitrary: arb2, weight: weight2 !== null ? weight2 : 1 },
            { arbitrary: arb3, weight: weight3 !== null ? weight3 : 1 },
          ],
          {}, // empty constraints
          'fc.oneof',
        );
        expect(out).toBe(expectedArb);
      }),
    );
  });
});
