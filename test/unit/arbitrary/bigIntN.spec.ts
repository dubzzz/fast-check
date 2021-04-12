import * as fc from '../../../lib/fast-check';
import { bigIntN } from '../../../src/arbitrary/bigIntN';

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

describe('bigIntN', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  it('should instantiate BigIntArbitrary(-2^(n-1), 2^(n-1) -1) for bigIntN(n)', () =>
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (n) => {
        // Arrange
        const instance = fakeBigIntArbitrary();
        const BigIntArbitrary = jest.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
        BigIntArbitrary.mockImplementation(() => instance);

        // Act
        const arb = bigIntN(n);

        // Assert
        expect(BigIntArbitrary).toHaveBeenCalledWith(
          -(BigInt(2) ** BigInt(n - 1)),
          BigInt(2) ** BigInt(n - 1) - BigInt(1)
        );
        expect(convertToNext(arb)).toBe(instance);
      })
    ));

  it('should throw when n value is lower than zero', () =>
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: -1 }), (n) => {
        // Arrange / Act / Assert
        expect(() => bigIntN(n)).toThrowError();
      })
    ));
});
