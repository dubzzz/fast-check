import { maxSafeInteger } from '../../../src/arbitrary/maxSafeInteger';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';

import * as IntegerArbitraryMock from '../../../src/arbitrary/_internals/IntegerArbitrary';

function fakeIntegerArbitrary() {
  const instance = fakeNextArbitrary<number>().instance as IntegerArbitraryMock.IntegerArbitrary;
  instance.defaultTarget = jest.fn();
  return instance;
}

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('maxSafeInteger', () => {
  it('should instantiate IntegerArbitrary(MIN_SAFE_INTEGER, MAX_SAFE_INTEGER) for maxSafeInteger()', () => {
    // Arrange
    const instance = fakeIntegerArbitrary();
    const IntegerArbitrary = jest.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
    IntegerArbitrary.mockImplementation(() => instance);

    // Act
    const arb = maxSafeInteger();

    // Assert
    expect(IntegerArbitrary).toHaveBeenCalledWith(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    expect(convertToNext(arb)).toBe(instance);
  });
});
