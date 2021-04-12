import * as fc from '../../../lib/fast-check';
import { bigUintN } from '../../../src/arbitrary/bigUintN';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';

import * as BigIntArbitraryMock from '../../../src/arbitrary/_internals/BigIntArbitrary';

function fakeBigIntArbitrary() {
  const instance = fakeNextArbitrary<bigint>().instance as BigIntArbitraryMock.BigIntArbitrary;
  instance.defaultTarget = jest.fn();
  return instance;
}

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('bigUintN', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  it('should instantiate BigIntArbitrary(0, 2^n -1) for bigIntN(n)', () =>
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (n) => {
        // Arrange
        const instance = fakeBigIntArbitrary();
        const BigIntArbitrary = jest.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
        BigIntArbitrary.mockImplementation(() => instance);

        // Act
        const arb = bigUintN(n);

        // Assert
        expect(BigIntArbitrary).toHaveBeenCalledWith(BigInt(0), BigInt(2) ** BigInt(n) - BigInt(1));
        expect(convertToNext(arb)).toBe(instance);
      })
    ));

  it('should throw when n value is lower than one', () =>
    fc.assert(
      fc.property(fc.integer({ min: Number.MIN_SAFE_INTEGER, max: 0 }), (n) => {
        // Arrange / Act / Assert
        expect(() => bigUintN(n)).toThrowError();
      })
    ));
});
