import * as fc from '../../../lib/fast-check';
import { falsy } from '../../../src/arbitrary/falsy';

import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';

import * as ConstantFromMock from '../../../src/arbitrary/constantFrom';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('falsy', () => {
  it('should re-use constantFrom to build the falsy', () => {
    // Arrange
    const { instance } = fakeNextArbitrary();
    const constantFrom = jest.spyOn(ConstantFromMock, 'constantFrom');
    constantFrom.mockImplementation(() => instance);

    // Act
    const arb = falsy();

    // Assert
    expect(constantFrom).toHaveBeenCalled();
    expect(arb).toBe(instance);
  });

  it('should only produce falsy values', () => {
    // Arrange
    const { instance } = fakeNextArbitrary();
    const constantFrom = jest.spyOn(ConstantFromMock, 'constantFrom');
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
    const { instance } = fakeNextArbitrary();
    const constantFrom = jest.spyOn(ConstantFromMock, 'constantFrom');
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
