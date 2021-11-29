import { int16Array } from '../../../src/arbitrary/int16Array';

import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';

import * as TypedIntArrayArbitraryArbitraryBuilderMock from '../../../src/arbitrary/_internals/builders/TypedIntArrayArbitraryBuilder';

describe('int16Array', () => {
  it('should call typedIntArrayArbitraryArbitraryBuilder for Int16Array', () => {
    // Arrange
    const instance = fakeNextArbitrary();
    const builder = jest.spyOn(TypedIntArrayArbitraryArbitraryBuilderMock, 'typedIntArrayArbitraryArbitraryBuilder');
    builder.mockImplementation(() => instance);

    // Act
    const arb = int16Array();

    // Assert
    expect(arb).toBe(instance);
    expect(builder).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.any(Number),
      Int16Array,
      expect.anything()
    );
  });

  it('should call typedIntArrayArbitraryArbitraryBuilder with extreme values for min and max', () => {
    // Arrange
    const instance = fakeNextArbitrary();
    const builder = jest.spyOn(TypedIntArrayArbitraryArbitraryBuilderMock, 'typedIntArrayArbitraryArbitraryBuilder');
    builder.mockImplementation(() => instance);

    // Act
    int16Array();
    const params = builder.mock.calls[0];
    const min = params[1] as number;
    const max = params[2] as number;
    const Class = params[3] as typeof Int16Array;

    // Assert
    expect(Class.from([min])[0]).toBe(min);
    expect(Class.from([max])[0]).toBe(max);
    expect(Class.from([min - 1])[0]).not.toBe(min - 1);
    expect(Class.from([max + 1])[0]).not.toBe(max + 1);
  });
});
