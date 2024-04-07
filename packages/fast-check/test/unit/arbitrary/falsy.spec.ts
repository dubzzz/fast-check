import * as fc from 'fast-check';
import { falsy } from '../../../src/arbitrary/falsy';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as ConstantFromMock from '../../../src/arbitrary/constantFrom';

function beforeEachHook() {
  vi.resetModules();
  vi.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('falsy', () => {
  it('should re-use constantFrom to build the falsy', () => {
    // Arrange
    const { instance } = fakeArbitrary();
    const constantFrom = vi.spyOn(ConstantFromMock, 'constantFrom');
    constantFrom.mockImplementation(() => instance);

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
    constantFrom.mockImplementation(() => instance);

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
    constantFrom.mockImplementation(() => instance);

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
