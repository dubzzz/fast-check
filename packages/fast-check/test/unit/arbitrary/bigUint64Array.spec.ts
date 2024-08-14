import { describe, it, expect, vi } from 'vitest';
import { bigUint64Array } from '../../../src/arbitrary/bigUint64Array';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as TypedIntArrayArbitraryArbitraryBuilderMock from '../../../src/arbitrary/_internals/builders/TypedIntArrayArbitraryBuilder';

describe('bigUint64Array', () => {
  it('should call typedIntArrayArbitraryArbitraryBuilder for BigUint64Array', () => {
    // Arrange
    const instance = fakeArbitrary();
    const builder = vi.spyOn(TypedIntArrayArbitraryArbitraryBuilderMock, 'typedIntArrayArbitraryArbitraryBuilder');
    builder.mockImplementation(() => instance);

    // Act
    const arb = bigUint64Array();

    // Assert
    expect(arb).toBe(instance);
    expect(builder).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(BigInt),
      expect.any(BigInt),
      BigUint64Array,
      expect.anything(),
    );
  });

  it('should call typedIntArrayArbitraryArbitraryBuilder with extreme values for min and max', () => {
    // Arrange
    const instance = fakeArbitrary();
    const builder = vi.spyOn(TypedIntArrayArbitraryArbitraryBuilderMock, 'typedIntArrayArbitraryArbitraryBuilder');
    builder.mockImplementation(() => instance);

    // Act
    bigUint64Array();
    const params = builder.mock.calls[0];
    const min = params[1] as bigint;
    const max = params[2] as bigint;
    const Class = params[3] as typeof BigUint64Array;

    // Assert
    expect(Class.from([min])[0]).toBe(min);
    expect(Class.from([max])[0]).toBe(max);
    expect(Class.from([min - BigInt(1)])[0]).not.toBe(min - BigInt(1));
    expect(Class.from([max + BigInt(1)])[0]).not.toBe(max + BigInt(1));
  });
});
