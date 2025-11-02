import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { nat, type NatConstraints } from '../../../src/arbitrary/nat';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as IntegerArbitraryMock from '../../../src/arbitrary/_internals/IntegerArbitrary';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

function fakeIntegerArbitrary() {
  const instance = fakeArbitrary<number>().instance as IntegerArbitraryMock.IntegerArbitrary;
  return instance;
}

describe('nat', () => {
  declareCleaningHooksForSpies();

  it('should instantiate IntegerArbitrary(0, 0x7fffffff) for nat()', () => {
    // Arrange
    const instance = fakeIntegerArbitrary();
    const IntegerArbitrary = vi.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
    IntegerArbitrary.mockImplementation(function() { return instance; } as any);

    // Act
    const arb = nat();

    // Assert
    expect(IntegerArbitrary).toHaveBeenCalledWith(0, 0x7fffffff);
    expect(arb).toBe(instance);
  });

  it('should instantiate IntegerArbitrary(0, 0x7fffffff) for nat({})', () => {
    // Arrange
    const instance = fakeIntegerArbitrary();
    const IntegerArbitrary = vi.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
    IntegerArbitrary.mockImplementation(function() { return instance; } as any);

    // Act
    const arb = nat({});

    // Assert
    expect(IntegerArbitrary).toHaveBeenCalledWith(0, 0x7fffffff);
    expect(arb).toBe(instance);
  });

  it('should instantiate IntegerArbitrary(0, max) for nat({max})', () =>
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (max) => {
        // Arrange
        const instance = fakeIntegerArbitrary();
        const IntegerArbitrary = vi.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
        IntegerArbitrary.mockImplementation(function() { return instance; } as any);

        // Act
        const arb = nat({ max });

        // Assert
        expect(IntegerArbitrary).toHaveBeenCalledWith(0, max);
        expect(arb).toBe(instance);
      }),
    ));

  it('should instantiate IntegerArbitrary(0, max) for nat(max)', () =>
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (max) => {
        // Arrange
        const instance = fakeIntegerArbitrary();
        const IntegerArbitrary = vi.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
        IntegerArbitrary.mockImplementation(function() { return instance; } as any);

        // Act
        const arb = nat(max);

        // Assert
        expect(IntegerArbitrary).toHaveBeenCalledWith(0, max);
        expect(arb).toBe(instance);
      }),
    ));

  it('should throw when maximum value is lower than zero', () =>
    fc.assert(
      fc.property(fc.integer({ min: Number.MIN_SAFE_INTEGER, max: -1 }), (max) => {
        // Arrange / Act / Assert
        expect(() => nat({ max })).toThrowError();
      }),
    ));

  it('should throw when maximum value is not an integer', () => {
    fc.assert(
      fc.property(fc.double(), (max) => {
        // Arrange
        fc.pre(!Number.isInteger(max));

        // Act / Assert
        expect(() => nat({ max })).toThrowError();
      }),
    );
  });

  it('should handle union type of number | NatConstraints', () =>
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.integer({ min: 0 }),
          fc.record({}),
          fc.record({ max: fc.integer({ min: 0 }) }),
        ),
        (constraints: number | NatConstraints | undefined) => {
          // Arrange
          const expectedMax = typeof constraints === 'number' ? constraints : (constraints?.max ?? null);
          const instance = fakeIntegerArbitrary();
          const IntegerArbitrary = vi.spyOn(IntegerArbitraryMock, 'IntegerArbitrary');
          IntegerArbitrary.mockImplementation(function() { return instance; } as any);

          // Act
          const arb = constraints === undefined ? nat() : nat(constraints);

          // Assert
          expect(IntegerArbitrary).toHaveBeenCalledWith(0, expectedMax ?? expect.anything());
          expect(arb).toBe(instance);
        },
      ),
    ));
});
