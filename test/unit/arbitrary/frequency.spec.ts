import * as fc from '../../../lib/fast-check';
import { frequency, FrequencyContraints } from '../../../src/arbitrary/frequency';
import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import * as FrequencyArbitraryMock from '../../../src/arbitrary/_internals/FrequencyArbitrary';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('frequency', () => {
  it('should call FrequencyArbitrary.from with the right parameters when called with constraints', () =>
    fc.assert(
      fc.property(
        fc.record(
          {
            withCrossShrink: fc.boolean(),
            depthIdentifier: fc.string(),
            depthFactor: fc.double({ min: 0.01, noDefaultInfinity: true, noNaN: true }),
            maxDepth: fc.nat(),
          },
          { requiredKeys: [] }
        ),
        (constraints: Partial<FrequencyContraints>) => {
          // Arrange
          const expectedArb = fakeArbitrary().instance;
          const from = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
          from.mockReturnValue(expectedArb);
          const { instance: arb1 } = fakeArbitrary();
          const { instance: arb2 } = fakeArbitrary();
          const weight1 = 10;
          const weight2 = 3;

          // Act
          const out = frequency(
            constraints,
            { arbitrary: arb1, weight: weight1 },
            { arbitrary: arb2, weight: weight2 }
          );

          // Assert
          expect(from).toHaveBeenCalledWith(
            [
              { arbitrary: arb1, weight: weight1 },
              { arbitrary: arb2, weight: weight2 },
            ],
            constraints,
            'fc.frequency'
          );
          expect(out).toBe(expectedArb);
        }
      )
    ));

  it('should call FrequencyArbitrary.from with the right parameters when called without constraints', () => {
    // Arrange
    const expectedArb = fakeArbitrary().instance;
    const from = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
    from.mockReturnValue(expectedArb);
    const { instance: arb1 } = fakeArbitrary();
    const { instance: arb2 } = fakeArbitrary();
    const weight1 = 10;
    const weight2 = 3;

    // Act
    const out = frequency({ arbitrary: arb1, weight: weight1 }, { arbitrary: arb2, weight: weight2 });

    // Assert
    expect(from).toHaveBeenCalledWith(
      [
        { arbitrary: arb1, weight: weight1 },
        { arbitrary: arb2, weight: weight2 },
      ],
      {},
      'fc.frequency'
    );
    expect(out).toBe(expectedArb);
  });
});
