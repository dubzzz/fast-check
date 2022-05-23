import * as fc from '../../../lib/fast-check';
import { oneof, OneOfConstraints } from '../../../src/arbitrary/oneof';
import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import * as FrequencyArbitraryMock from '../../../src/arbitrary/_internals/FrequencyArbitrary';
import { sizeArb } from './__test-helpers__/SizeHelpers';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('oneof', () => {
  it('should adapt received MaybeWeightedArbitrary for FrequencyArbitrary.from when called with constraints', () => {
    fc.assert(
      fc.property(
        fc.record(
          {
            withCrossShrink: fc.boolean(),
            depthIdentifier: fc.string(),
            depthSize: fc.oneof(fc.double({ min: 0, noNaN: true }), sizeArb),
            maxDepth: fc.nat(),
          },
          { requiredKeys: [] }
        ),
        fc.option(fc.nat()),
        fc.option(fc.nat()),
        fc.option(fc.nat()),
        (constraints: Partial<OneOfConstraints>, weight1, weight2, weight3) => {
          // Arrange
          const expectedArb = fakeArbitrary().instance;
          const from = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
          from.mockReturnValue(expectedArb);
          const { instance: arb1 } = fakeArbitrary();
          const { instance: arb2 } = fakeArbitrary();
          const { instance: arb3 } = fakeArbitrary();

          // Act
          const out = oneof(
            constraints,
            weight1 !== null ? { arbitrary: arb1, weight: weight1 } : arb1,
            weight2 !== null ? { arbitrary: arb2, weight: weight2 } : arb2,
            weight3 !== null ? { arbitrary: arb3, weight: weight3 } : arb3
          );

          // Assert
          expect(from).toHaveBeenCalledWith(
            [
              { arbitrary: arb1, weight: weight1 !== null ? weight1 : 1 },
              { arbitrary: arb2, weight: weight2 !== null ? weight2 : 1 },
              { arbitrary: arb3, weight: weight3 !== null ? weight3 : 1 },
            ],
            constraints,
            'fc.oneof'
          );
          expect(out).toBe(expectedArb);
        }
      )
    );
  });

  it('should adapt received MaybeWeightedArbitrary for FrequencyArbitrary.from when called without constraints', () => {
    fc.assert(
      fc.property(fc.option(fc.nat()), fc.option(fc.nat()), fc.option(fc.nat()), (weight1, weight2, weight3) => {
        // Arrange
        const expectedArb = fakeArbitrary().instance;
        const from = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
        from.mockReturnValue(expectedArb);
        const { instance: arb1 } = fakeArbitrary();
        const { instance: arb2 } = fakeArbitrary();
        const { instance: arb3 } = fakeArbitrary();

        // Act
        const out = oneof(
          weight1 !== null ? { arbitrary: arb1, weight: weight1 } : arb1,
          weight2 !== null ? { arbitrary: arb2, weight: weight2 } : arb2,
          weight3 !== null ? { arbitrary: arb3, weight: weight3 } : arb3
        );

        // Assert
        expect(from).toHaveBeenCalledWith(
          [
            { arbitrary: arb1, weight: weight1 !== null ? weight1 : 1 },
            { arbitrary: arb2, weight: weight2 !== null ? weight2 : 1 },
            { arbitrary: arb3, weight: weight3 !== null ? weight3 : 1 },
          ],
          {}, // empty constraints
          'fc.oneof'
        );
        expect(out).toBe(expectedArb);
      })
    );
  });
});
