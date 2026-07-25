import * as fc from 'fast-check';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { iterator } from '../../../src/arbitrary/iterator.js';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers.js';

import * as IteratorArbitraryMock from '../../../src/arbitrary/_internals/IteratorArbitrary.js';

function beforeEachHook() {
  vi.resetModules();
  vi.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('iterator', () => {
  it('should instantiate IteratorArbitrary(arb, true) for iterator(arb)', () => {
    // Arrange
    const { instance: sourceArbitrary } = fakeArbitrary();
    const { instance } = fakeArbitrary();
    const IteratorArbitrary = vi.spyOn(IteratorArbitraryMock, 'IteratorArbitrary');
    IteratorArbitrary.mockImplementation(function () {
      return instance as IteratorArbitraryMock.IteratorArbitrary<unknown>;
    });

    // Act
    const arb = iterator(sourceArbitrary);

    // Assert
    expect(IteratorArbitrary).toHaveBeenCalledWith(sourceArbitrary, true);
    expect(arb).toBe(instance);
  });

  it('should instantiate IteratorArbitrary(arb, !noHistory) for iterator(arb, { noHistory })', async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), (history) => {
        // Arrange
        const { instance: sourceArbitrary } = fakeArbitrary();
        const { instance } = fakeArbitrary();
        const IteratorArbitrary = vi.spyOn(IteratorArbitraryMock, 'IteratorArbitrary');
        IteratorArbitrary.mockImplementation(function () {
          return instance as IteratorArbitraryMock.IteratorArbitrary<unknown>;
        });

        // Act
        const arb = iterator(sourceArbitrary, { noHistory: !history });

        // Assert
        expect(IteratorArbitrary).toHaveBeenCalledWith(sourceArbitrary, history);
        expect(arb).toBe(instance);
      }),
    );
  });
});
