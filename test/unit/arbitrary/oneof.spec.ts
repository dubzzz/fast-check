import { oneof, OneOfConstraints } from '../../../src/arbitrary/oneof';
import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';
import * as FrequencyArbitraryMock from '../../../src/arbitrary/_internals/FrequencyArbitrary';

describe('oneof', () => {
  it('should call FrequencyArbitrary.from with empty constraints if no constraints have been passed', () => {
    // Arrange
    const expectedArb = fakeNextArbitrary().instance;
    const fromOld = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'fromOld');
    fromOld.mockReturnValue(expectedArb);
    const { instance: arb1 } = fakeNextArbitrary();
    const { instance: arb2 } = fakeNextArbitrary();

    // Act
    const out = oneof(arb1, arb2);

    // Assert
    expect(fromOld).toHaveBeenCalledWith(
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
    const expectedArb = fakeNextArbitrary().instance;
    const fromOld = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'fromOld');
    fromOld.mockReturnValue(expectedArb);
    const constraints: OneOfConstraints = { maxDepth: 10, depthIdentifier: 'hello' };
    const { instance: arb1 } = fakeNextArbitrary();
    const { instance: arb2 } = fakeNextArbitrary();

    // Act
    const out = oneof(constraints, arb1, arb2);

    // Assert
    expect(fromOld).toHaveBeenCalledWith(
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
    const expectedArb = fakeNextArbitrary().instance;
    const fromOld = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'fromOld');
    fromOld.mockReturnValue(expectedArb);
    const constraints: OneOfConstraints = {};
    const { instance: arb1 } = fakeNextArbitrary();
    const { instance: arb2 } = fakeNextArbitrary();

    // Act
    const out = oneof(constraints, arb1, arb2);

    // Assert
    expect(fromOld).toHaveBeenCalledWith(
      [
        { arbitrary: arb1, weight: 1 },
        { arbitrary: arb2, weight: 1 },
      ],
      constraints,
      'fc.oneof'
    );
    expect(out).toBe(expectedArb);
  });
});
