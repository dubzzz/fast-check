import { tuple } from '../../../src/arbitrary/tuple';
import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';
import * as TupleArbitraryMock from '../../../src/arbitrary/_internals/TupleArbitrary';

describe('tuple', () => {
  it('should instantiate a TupleArbitrary based on mapped-to-next arbitraries', () => {
    // Arrange
    const { instance } = fakeNextArbitrary<unknown[]>();
    const TupleArbitrary = jest.spyOn(TupleArbitraryMock, 'TupleArbitrary');
    TupleArbitrary.mockImplementation(() => instance as any);
    const { instance: nextArb1 } = fakeNextArbitrary();
    const { instance: nextArb2 } = fakeNextArbitrary();
    const arb1 = nextArb1;
    const arb2 = nextArb2;

    // Act
    const out = tuple(arb1, arb2);

    // Assert
    expect(out).toBe(instance);
    expect(TupleArbitrary).toHaveBeenCalledWith([nextArb1, nextArb2]);
  });
});
