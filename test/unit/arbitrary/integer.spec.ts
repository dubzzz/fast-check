import * as fc from '../../../lib/fast-check';
import { integer } from '../../../src/arbitrary/integer';

import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';

import * as IntegerArbitraryMock from '../../../src/arbitrary/_internals/IntegerArbitrary';

function fakeIntegerArbitrary() {
  const instance = fakeNextArbitrary<number>().instance as IntegerArbitraryMock.IntegerArbitrary;
  instance.defaultTarget = jest.fn();
  return instance;
}

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('integer', () => {
  it('should instantiate IntegerArbitrary(-0x80000000, 0x7fffffff) for integer()', () => {
    // Arrange
    const instance = fakeIntegerArbitrary();
    const IntegerArbitrary = jest.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
    IntegerArbitrary.mockImplementation(() => instance);

    // Act
    const arb = integer();

    // Assert
    expect(IntegerArbitrary).toHaveBeenCalledWith(-0x80000000, 0x7fffffff);
    expect(arb).toBe(instance);
  });

  it('should instantiate IntegerArbitrary(-0x80000000, 0x7fffffff) for integer({})', () => {
    // Arrange
    const instance = fakeIntegerArbitrary();
    const IntegerArbitrary = jest.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
    IntegerArbitrary.mockImplementation(() => instance);

    // Act
    const arb = integer({});

    // Assert
    expect(IntegerArbitrary).toHaveBeenCalledWith(-0x80000000, 0x7fffffff);
    expect(arb).toBe(instance);
  });

  it('should instantiate IntegerArbitrary(min, 0x7fffffff) for integer({min})', () =>
    fc.assert(
      fc.property(fc.integer({ min: Number.MIN_SAFE_INTEGER, max: 0x7fffffff }), (min) => {
        // Arrange
        const instance = fakeIntegerArbitrary();
        const IntegerArbitrary = jest.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
        IntegerArbitrary.mockImplementation(() => instance);

        // Act
        const arb = integer({ min });

        // Assert
        expect(IntegerArbitrary).toHaveBeenCalledWith(min, 0x7fffffff);
        expect(arb).toBe(instance);
      })
    ));

  it('should instantiate IntegerArbitrary(-0x80000000, max) for integer({max})', () =>
    fc.assert(
      fc.property(fc.integer({ min: -0x80000000, max: Number.MAX_SAFE_INTEGER }), (max) => {
        // Arrange
        const instance = fakeIntegerArbitrary();
        const IntegerArbitrary = jest.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
        IntegerArbitrary.mockImplementation(() => instance);

        // Act
        const arb = integer({ max });

        // Assert
        expect(IntegerArbitrary).toHaveBeenCalledWith(-0x80000000, max);
        expect(arb).toBe(instance);
      })
    ));

  it('should instantiate IntegerArbitrary(min, max) for integer({min, max})', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), (a, b) => {
        // Arrange
        const [min, max] = a < b ? [a, b] : [b, a];
        const instance = fakeIntegerArbitrary();
        const IntegerArbitrary = jest.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
        IntegerArbitrary.mockImplementation(() => instance);

        // Act
        const arb = integer({ min, max });

        // Assert
        expect(IntegerArbitrary).toHaveBeenCalledWith(min, max);
        expect(arb).toBe(instance);
      })
    ));

  it('[legacy] should instantiate IntegerArbitrary(min, max) for integer(min, max)', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), (a, b) => {
        // Arrange
        const [min, max] = a < b ? [a, b] : [b, a];
        const instance = fakeIntegerArbitrary();
        const IntegerArbitrary = jest.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
        IntegerArbitrary.mockImplementation(() => instance);

        // Act
        const arb = integer(min, max);

        // Assert
        expect(IntegerArbitrary).toHaveBeenCalledWith(min, max);
        expect(arb).toBe(instance);
      })
    ));

  it('should throw when minimum value is greater than default maximum one', () =>
    fc.assert(
      fc.property(fc.integer({ min: 0x80000000, max: Number.MAX_SAFE_INTEGER }), (min) => {
        // Arrange / Act / Assert
        expect(() => integer({ min })).toThrowError();
      })
    ));

  it('should throw when maximum value is lower than default minimum one', () =>
    fc.assert(
      fc.property(fc.integer({ min: Number.MIN_SAFE_INTEGER, max: -0x80000001 }), (max) => {
        // Arrange / Act / Assert
        expect(() => integer({ max })).toThrowError();
      })
    ));

  it('should throw when minimum value is greater than maximum one', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), (a, b) => {
        // Arrange
        fc.pre(a !== b);
        const [low, high] = a < b ? [a, b] : [b, a];

        // Act / Assert
        expect(() => integer({ min: high, max: low })).toThrowError();
      })
    ));
});
