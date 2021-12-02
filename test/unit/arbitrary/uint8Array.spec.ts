import { uint8Array } from '../../../src/arbitrary/uint8Array';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as TypedIntArrayArbitraryArbitraryBuilderMock from '../../../src/arbitrary/_internals/builders/TypedIntArrayArbitraryBuilder';

describe('uint8Array', () => {
  it('should call typedIntArrayArbitraryArbitraryBuilder for Uint8Array', () => {
    // Arrange
    const instance = fakeArbitrary();
    const builder = jest.spyOn(TypedIntArrayArbitraryArbitraryBuilderMock, 'typedIntArrayArbitraryArbitraryBuilder');
    builder.mockImplementation(() => instance);

    // Act
    const arb = uint8Array();

    // Assert
    expect(arb).toBe(instance);
    expect(builder).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.any(Number),
      Uint8Array,
      expect.anything()
    );
  });

  it('should call typedIntArrayArbitraryArbitraryBuilder with extreme values for min and max', () => {
    // Arrange
    const instance = fakeArbitrary();
    const builder = jest.spyOn(TypedIntArrayArbitraryArbitraryBuilderMock, 'typedIntArrayArbitraryArbitraryBuilder');
    builder.mockImplementation(() => instance);

    // Act
    uint8Array();
    const params = builder.mock.calls[0];
    const min = params[1] as number;
    const max = params[2] as number;
    const Class = params[3] as typeof Uint8Array;

    // Assert
    expect(Class.from([min])[0]).toBe(min);
    expect(Class.from([max])[0]).toBe(max);
    expect(Class.from([min - 1])[0]).not.toBe(min - 1);
    expect(Class.from([max + 1])[0]).not.toBe(max + 1);
  });
});
