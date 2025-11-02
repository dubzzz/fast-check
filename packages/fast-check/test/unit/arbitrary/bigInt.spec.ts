import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { bigInt, type BigIntConstraints } from '../../../src/arbitrary/bigInt';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

import * as BigIntArbitraryMock from '../../../src/arbitrary/_internals/BigIntArbitrary';

function fakeBigIntArbitrary() {
  const instance = fakeArbitrary<bigint>().instance as BigIntArbitraryMock.BigIntArbitrary;
  return instance;
}

describe('bigInt', () => {
  declareCleaningHooksForSpies();

  it('should instantiate the same BigIntArbitrary as empty constraints for no arguments', () => {
    // Arrange
    const instance = fakeBigIntArbitrary();
    const BigIntArbitrary = vi.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
    BigIntArbitrary.mockImplementation(function() { return instance; } as any);

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
        const BigIntArbitrary = vi.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
        BigIntArbitrary.mockImplementation(function() { return instance; } as any);

        // Act
        const arb = bigInt({ min: withMin ? min : undefined, max: withMax ? max : undefined });

        // Assert
        expect(BigIntArbitrary).toHaveBeenCalledWith(
          withMin ? min : expect.any(BigInt),
          withMax ? max : expect.any(BigInt),
        );
        const argumentsForCall = BigIntArbitrary.mock.calls[0];
        expect(argumentsForCall[0]).toBeLessThanOrEqual(argumentsForCall[1]);
        expect(arb).toBe(instance);
      }),
    ));

  it('[legacy] should instantiate the same BigIntArbitrary as constraints-based for bigInt(min, max)', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), (a, b) => {
        // Arrange
        const [min, max] = a < b ? [a, b] : [b, a];
        const instance = fakeBigIntArbitrary();
        const BigIntArbitrary = vi.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
        BigIntArbitrary.mockImplementation(function() { return instance; } as any);

        // Act
        const arb = bigInt(min, max);
        const arbConstraints = bigInt({ min, max });

        // Assert
        expect(BigIntArbitrary).toHaveBeenCalledTimes(2);
        expect(BigIntArbitrary.mock.calls[1]).toEqual(BigIntArbitrary.mock.calls[0]); // same arguments
        expect(arb).toBe(instance);
        expect(arbConstraints).toBe(instance);
      }),
    ));

  it('should throw when minimum value is greater than maximum one', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), (a, b) => {
        // Arrange
        fc.pre(a !== b);
        const [low, high] = a < b ? [a, b] : [b, a];

        // Act / Assert
        expect(() => bigInt({ min: high, max: low })).toThrowError();
      }),
    ));

  it('should handle union type of [number, number] | BigIntConstraints', () =>
    fc.assert(
      fc.property(
        fc.oneof(
          // no argument
          fc.tuple(),
          // min, max range
          fc.tuple(fc.bigInt(), fc.bigInt()).map<[bigint, bigint]>((t) => (t[0] < t[1] ? [t[0], t[1]] : [t[1], t[0]])),
          // both min and max defined
          fc.tuple(
            fc.record({ min: fc.bigInt(), max: fc.bigInt() }).map((c) => ({
              min: c.min < c.max ? c.min : c.max,
              max: c.min < c.max ? c.max : c.min,
            })),
          ),
          // one or the other maybe defined
          fc.tuple(fc.record({ min: fc.option(fc.bigInt(), { nil: undefined }) })),
          fc.tuple(fc.record({ max: fc.option(fc.bigInt(), { nil: undefined }) })),
        ),
        (args: [] | [bigint, bigint] | [BigIntConstraints]) => {
          // Arrange
          const [expectedMin, expectedMax] =
            args.length === 0 ? [null, null] : args.length === 1 ? [args[0].min, args[0].max] : [args[0], args[1]];
          const instance = fakeBigIntArbitrary();
          const BigIntArbitrary = vi.spyOn(BigIntArbitraryMock, 'BigIntArbitrary');
          BigIntArbitrary.mockImplementation(function() { return instance; } as any);

          // Act
          const arb = bigInt(...args);

          // Assert
          expect(BigIntArbitrary).toHaveBeenCalledWith(
            expectedMin ?? expect.any(BigInt),
            expectedMax ?? expect.any(BigInt),
          );
          expect(arb).toBe(instance);
        },
      ),
    ));
});
