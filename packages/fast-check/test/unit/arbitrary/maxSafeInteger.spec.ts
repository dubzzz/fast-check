import { beforeEach, describe, it, expect, vi } from 'vitest';
import { maxSafeInteger } from '../../../src/arbitrary/maxSafeInteger';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as IntegerArbitraryMock from '../../../src/arbitrary/_internals/IntegerArbitrary';

function fakeIntegerArbitrary() {
  const instance = fakeArbitrary<number>().instance as IntegerArbitraryMock.IntegerArbitrary;
  return instance;
}

function beforeEachHook() {
  vi.resetModules();
  vi.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('maxSafeInteger', () => {
  it('should instantiate IntegerArbitrary(MIN_SAFE_INTEGER, MAX_SAFE_INTEGER) for maxSafeInteger()', () => {
    // Arrange
    const instance = fakeIntegerArbitrary();
    const IntegerArbitrary = vi.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
    IntegerArbitrary.mockImplementation(function() { return instance; } as any);

    // Act
    const arb = maxSafeInteger();

    // Assert
    expect(IntegerArbitrary).toHaveBeenCalledWith(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    expect(arb).toBe(instance);
  });
});
