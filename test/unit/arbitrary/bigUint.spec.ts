import * as fc from '../../../lib/fast-check';
import { bigUint } from '../../../src/arbitrary/bigUint';

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

describe('bigUint', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  it('should instantiate the same BigIntArbitrary as empty constraints for no arguments', () => {
    // Arrange
    const instance = fakeBigIntArbitrary();
    const BigIntArbitrary = jest.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
    BigIntArbitrary.mockImplementation(() => instance);

    // Act
    const arb = bigUint();
    const arbEmpty = bigUint({});

    // Assert
    expect(BigIntArbitrary).toHaveBeenCalledTimes(2);
    expect(BigIntArbitrary.mock.calls[1]).toEqual(BigIntArbitrary.mock.calls[0]); // same arguments
    const argumentsForCall = BigIntArbitrary.mock.calls[0];
    expect(argumentsForCall[0]).toBeLessThan(argumentsForCall[1]); // range should not be restricted to one value
    expect(argumentsForCall[0]).toBe(BigInt(0));
    expect(convertToNext(arb)).toBe(instance);
    expect(convertToNext(arbEmpty)).toBe(instance);
  });

  it('should instantiate BigIntArbitrary(0, max) for bigUint({max})', () =>
    fc.assert(
      fc.property(fc.bigUint(), (max) => {
        // Arrange
        const instance = fakeBigIntArbitrary();
        const BigIntArbitrary = jest.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
        BigIntArbitrary.mockImplementation(() => instance);

        // Act
        const arb = bigUint({ max });

        // Assert
        expect(BigIntArbitrary).toHaveBeenCalledWith(BigInt(0), max);
        expect(convertToNext(arb)).toBe(instance);
      })
    ));

  it('should instantiate BigIntArbitrary(0, max) for bigUint(max)', () =>
    fc.assert(
      fc.property(fc.bigUint(), (max) => {
        // Arrange
        const instance = fakeBigIntArbitrary();
        const BigIntArbitrary = jest.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
        BigIntArbitrary.mockImplementation(() => instance);

        // Act
        const arb = bigUint(max);

        // Assert
        expect(BigIntArbitrary).toHaveBeenCalledWith(BigInt(0), max);
        expect(convertToNext(arb)).toBe(instance);
      })
    ));

  it('should throw when maximum value is lower than zero', () =>
    fc.assert(
      fc.property(fc.bigInt({ max: BigInt(-1) }), (max) => {
        // Arrange / Act / Assert
        expect(() => bigUint({ max })).toThrowError();
      })
    ));
});
