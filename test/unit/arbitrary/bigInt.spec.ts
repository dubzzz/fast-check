import * as fc from '../../../lib/fast-check';
import { bigInt } from '../../../src/arbitrary/bigInt';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as BigIntArbitraryMock from '../../../src/arbitrary/_internals/BigIntArbitrary';

function fakeBigIntArbitrary() {
  const instance = fakeArbitrary<bigint>().instance as BigIntArbitraryMock.BigIntArbitrary;
  return instance;
}

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('bigInt', () => {
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
    const arb = bigInt();
    const arbEmpty = bigInt({});

    // Assert
    expect(BigIntArbitrary).toHaveBeenCalledTimes(2);
    expect(BigIntArbitrary.mock.calls[1]).toEqual(BigIntArbitrary.mock.calls[0]); // same arguments
    const argumentsForCall = BigIntArbitrary.mock.calls[0];
    expect(argumentsForCall[0]).toBeLessThan(argumentsForCall[1]); // range should not be restricted to one value
    expect(arb).toBe(instance);
    expect(arbEmpty).toBe(instance);
  });

  it('should instantiate BigIntArbitrary with passed constraints and default missing ones', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), fc.boolean(), fc.boolean(), (a, b, withMin, withMax) => {
        // Arrange
        const [min, max] = a < b ? [a, b] : [b, a];
        const instance = fakeBigIntArbitrary();
        const BigIntArbitrary = jest.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
        BigIntArbitrary.mockImplementation(() => instance);

        // Act
        const arb = bigInt({ min: withMin ? min : undefined, max: withMax ? max : undefined });

        // Assert
        expect(BigIntArbitrary).toHaveBeenCalledWith(
          withMin ? min : expect.any(BigInt),
          withMax ? max : expect.any(BigInt)
        );
        const argumentsForCall = BigIntArbitrary.mock.calls[0];
        expect(argumentsForCall[0]).toBeLessThanOrEqual(argumentsForCall[1]);
        expect(arb).toBe(instance);
      })
    ));

  it('[legacy] should instantiate the same BigIntArbitrary as constraints-based for bigInt(min, max)', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), (a, b) => {
        // Arrange
        const [min, max] = a < b ? [a, b] : [b, a];
        const instance = fakeBigIntArbitrary();
        const BigIntArbitrary = jest.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
        BigIntArbitrary.mockImplementation(() => instance);

        // Act
        const arb = bigInt(min, max);
        const arbConstraints = bigInt({ min, max });

        // Assert
        expect(BigIntArbitrary).toHaveBeenCalledTimes(2);
        expect(BigIntArbitrary.mock.calls[1]).toEqual(BigIntArbitrary.mock.calls[0]); // same arguments
        expect(arb).toBe(instance);
        expect(arbConstraints).toBe(instance);
      })
    ));

  it('should throw when minimum value is greater than maximum one', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), (a, b) => {
        // Arrange
        fc.pre(a !== b);
        const [low, high] = a < b ? [a, b] : [b, a];

        // Act / Assert
        expect(() => bigInt({ min: high, max: low })).toThrowError();
      })
    ));
});
