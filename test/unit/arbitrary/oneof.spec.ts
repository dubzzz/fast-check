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
  it('should call FrequencyArbitrary.from with empty constraints if no constraints have been passed', () => {
    // Arrange
    const expectedArb = fakeArbitrary().instance;
    const from = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
    from.mockReturnValue(expectedArb);
    const { instance: arb1 } = fakeArbitrary();
    const { instance: arb2 } = fakeArbitrary();

    // Act
    const out = oneof(arb1, arb2);

    // Assert
    expect(from).toHaveBeenCalledWith(
      [
        { arbitrary: arb1, weight: 1 },
        { arbitrary: arb2, weight: 1 },
      ],
      {}, // empty constraints
      'fc.oneof'
    );
    expect(out).toBe(expectedArb);
  });

  it('should pass received constraints to FrequencyArbitrary.from', () => {
    // Arrange
    const expectedArb = fakeArbitrary().instance;
    const from = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
    from.mockReturnValue(expectedArb);
    const constraints: OneOfConstraints = { maxDepth: 10, depthIdentifier: 'hello' };
    const { instance: arb1 } = fakeArbitrary();
    const { instance: arb2 } = fakeArbitrary();

    // Act
    const out = oneof(constraints, arb1, arb2);

    // Assert
    expect(from).toHaveBeenCalledWith(
      [
        { arbitrary: arb1, weight: 1 },
        { arbitrary: arb2, weight: 1 },
      ],
      constraints,
      'fc.oneof'
    );
    expect(out).toBe(expectedArb);
  });

  it('should pass received constraints to FrequencyArbitrary.from even if empty', () => {
    // Arrange
    const expectedArb = fakeArbitrary().instance;
    const from = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
    from.mockReturnValue(expectedArb);
    const constraints: OneOfConstraints = {};
    const { instance: arb1 } = fakeArbitrary();
    const { instance: arb2 } = fakeArbitrary();

    // Act
    const out = oneof(constraints, arb1, arb2);

    // Assert
    expect(from).toHaveBeenCalledWith(
      [
        { arbitrary: arb1, weight: 1 },
        { arbitrary: arb2, weight: 1 },
      ],
      constraints,
      'fc.oneof'
    );
    expect(out).toBe(expectedArb);
  });

  it('should call FrequencyArbitrary.from with the right parameters when called with constraints and weighted', () => {
    fc.assert(
      fc.property(
        fc.record(
          {
            withCrossShrink: fc.boolean(),
            depthIdentifier: fc.string(),
            depthFactor: fc.oneof(fc.double({ min: 0.01, noDefaultInfinity: true, noNaN: true }), sizeArb),
            maxDepth: fc.nat(),
          },
          { requiredKeys: [] }
        ),
        (constraints: Partial<OneOfConstraints>) => {
          // Arrange
          const expectedArb = fakeArbitrary().instance;
          const from = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
          from.mockReturnValue(expectedArb);
          const { instance: arb1 } = fakeArbitrary();
          const { instance: arb2 } = fakeArbitrary();
          const weight1 = 10;
          const weight2 = 3;

          // Act
          const out = oneof(constraints, { arbitrary: arb1, weight: weight1 }, { arbitrary: arb2, weight: weight2 });

          // Assert
          expect(from).toHaveBeenCalledWith(
            [
              { arbitrary: arb1, weight: weight1 },
              { arbitrary: arb2, weight: weight2 },
            ],
            constraints,
            'fc.oneof'
          );
          expect(out).toBe(expectedArb);
        }
      )
    );
  });

  it('should call FrequencyArbitrary.from with the right parameters when called without constraints and weighted', () => {
    // Arrange
    const expectedArb = fakeArbitrary().instance;
    const from = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
    from.mockReturnValue(expectedArb);
    const { instance: arb1 } = fakeArbitrary();
    const { instance: arb2 } = fakeArbitrary();
    const weight1 = 10;
    const weight2 = 3;

    // Act
    const out = oneof({ arbitrary: arb1, weight: weight1 }, { arbitrary: arb2, weight: weight2 });

    // Assert
    expect(from).toHaveBeenCalledWith(
      [
        { arbitrary: arb1, weight: weight1 },
        { arbitrary: arb2, weight: weight2 },
      ],
      {},
      'fc.oneof'
    );
    expect(out).toBe(expectedArb);
  });
});
