import { tuple } from '../../../src/arbitrary/tuple';
import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';
import * as TupleArbitraryMock from '../../../src/arbitrary/_internals/TupleArbitrary';

describe('tuple', () => {
  it('should instantiate a TupleArbitrary based on mapped-to-next arbitraries', () => {
    // Arrange
    const { instance } = fakeNextArbitrary<unknown[]>();
    const TupleArbitrary = jest.spyOn(TupleArbitraryMock, 'TupleArbitrary');
    TupleArbitrary.mockImplementation(() => instance as any);
    const { instance: arb1 } = fakeNextArbitrary();
    const { instance: arb2 } = fakeNextArbitrary();

    // Act
    const out = tuple(arb1, arb2);

    // Assert
    expect(out).toBe(instance);
    expect(TupleArbitrary).toHaveBeenCalledWith([arb1, arb2]);
  });
});
