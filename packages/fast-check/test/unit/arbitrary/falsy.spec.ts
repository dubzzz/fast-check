import { describe, it, expect, vi } from 'vitest';
import { falsy } from '../../../src/arbitrary/falsy';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

import * as ConstantFromMock from '../../../src/arbitrary/constantFrom';

describe('falsy', () => {
  declareCleaningHooksForSpies();

  it('should re-use constantFrom to build the falsy', () => {
    // Arrange
    const { instance } = fakeArbitrary();
    const constantFrom = vi.spyOn(ConstantFromMock, 'constantFrom');
    constantFrom.mockImplementation(function() { return instance; } as any);

    // Act
    const arb = falsy();

    // Assert
    expect(constantFrom).toHaveBeenCalled();
    expect(arb).toBe(instance);
  });

  it('should only produce falsy values', () => {
    // Arrange
    const { instance } = fakeArbitrary();
    const constantFrom = vi.spyOn(ConstantFromMock, 'constantFrom');
    constantFrom.mockImplementation(function() { return instance; } as any);

    // Act
    falsy();
    const possibleValues = constantFrom.mock.calls[0] as unknown[];

    // Assert
    expect(possibleValues).not.toHaveLength(0);
    for (const v of possibleValues) {
      expect(!v).toBe(true);
      expect(typeof v).not.toBe('bigint');
    }
  });

  it('should only produce falsy values even with withBigInt', () => {
    // Arrange
    const { instance } = fakeArbitrary();
    const constantFrom = vi.spyOn(ConstantFromMock, 'constantFrom');
    constantFrom.mockImplementation(function() { return instance; } as any);

    // Act
    falsy({ withBigInt: true });
    const possibleValues = constantFrom.mock.calls[0] as unknown[];

    // Assert
    expect(possibleValues).not.toHaveLength(0);
    for (const v of possibleValues) {
      expect(!v).toBe(true);
    }
    expect(possibleValues).toContain(BigInt(0));
  });
});
