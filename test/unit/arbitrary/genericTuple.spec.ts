import { genericTuple } from '../../../src/arbitrary/genericTuple';
import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';
import * as TupleArbitraryMock from '../../../src/arbitrary/_internals/TupleArbitrary';

describe('genericTuple', () => {
  it('should instantiate a TupleArbitrary based on mapped-to-next arbitraries', () => {
    // Arrange
    const { instance } = fakeNextArbitrary<unknown[]>();
    const TupleArbitrary = jest.spyOn(TupleArbitraryMock, 'TupleArbitrary');
    TupleArbitrary.mockImplementation(() => instance as any);
    const { instance: nextArb1 } = fakeNextArbitrary();
    const { instance: nextArb2 } = fakeNextArbitrary();
    const arb1 = convertFromNext(nextArb1);
    const arb2 = convertFromNext(nextArb2);

    // Act
    const out = genericTuple([arb1, arb2]);

    // Assert
    expect(convertToNext(out)).toBe(instance);
    expect(TupleArbitrary).toHaveBeenCalledWith([nextArb1, nextArb2]);
  });
});
