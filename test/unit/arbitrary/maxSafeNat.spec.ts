import { maxSafeNat } from '../../../src/arbitrary/maxSafeNat';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as IntegerArbitraryMock from '../../../src/arbitrary/_internals/IntegerArbitrary';

function fakeIntegerArbitrary() {
  const instance = fakeArbitrary<number>().instance as IntegerArbitraryMock.IntegerArbitrary;
  return instance;
}

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('maxSafeInteger', () => {
  it('should instantiate IntegerArbitrary(0, MAX_SAFE_INTEGER) for maxSafeInteger()', () => {
    // Arrange
    const instance = fakeIntegerArbitrary();
    const IntegerArbitrary = jest.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
    IntegerArbitrary.mockImplementation(() => instance);

    // Act
    const arb = maxSafeNat();

    // Assert
    expect(IntegerArbitrary).toHaveBeenCalledWith(0, Number.MAX_SAFE_INTEGER);
    expect(arb).toBe(instance);
  });
});
