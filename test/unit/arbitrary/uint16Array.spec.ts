import { uint16Array } from '../../../src/arbitrary/uint16Array';

import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';

import * as TypedIntArrayArbitraryArbitraryBuilderMock from '../../../src/arbitrary/_internals/builders/TypedIntArrayArbitraryBuilder';

describe('uint16Array', () => {
  it('should call typedIntArrayArbitraryArbitraryBuilder for Uint16Array', () => {
    // Arrange
    const instance = fakeNextArbitrary();
    const builder = jest.spyOn(TypedIntArrayArbitraryArbitraryBuilderMock, 'typedIntArrayArbitraryArbitraryBuilder');
    builder.mockImplementation(() => convertFromNext(instance));

    // Act
    const arb = uint16Array();

    // Assert
    expect(convertToNext(arb)).toBe(instance);
    expect(builder).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.any(Number),
      Uint16Array,
      expect.anything()
    );
  });

  it('should call typedIntArrayArbitraryArbitraryBuilder with extreme values for min and max', () => {
    // Arrange
    const instance = fakeNextArbitrary();
    const builder = jest.spyOn(TypedIntArrayArbitraryArbitraryBuilderMock, 'typedIntArrayArbitraryArbitraryBuilder');
    builder.mockImplementation(() => convertFromNext(instance));

    // Act
    uint16Array();
    const params = builder.mock.calls[0];
    const min = params[1] as number;
    const max = params[2] as number;
    const Class = params[3] as typeof Uint16Array;

    // Assert
    expect(Class.from([min])[0]).toBe(min);
    expect(Class.from([max])[0]).toBe(max);
    expect(Class.from([min - 1])[0]).not.toBe(min - 1);
    expect(Class.from([max + 1])[0]).not.toBe(max + 1);
  });
});
