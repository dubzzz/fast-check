import { beforeEach, describe, it, expect, vi } from 'vitest';
import { clone } from './clone.js';

import { fakeArbitrary } from '../../test/unit/arbitrary/__test-helpers__/ArbitraryHelpers.js';

import * as CloneArbitraryMock from './_internals/CloneArbitrary.js';

function beforeEachHook() {
  vi.resetModules();
  vi.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('clone', () => {
  it('should instantiate CloneArbitrary(arb, numValues) for clone(arb, numValues)', () => {
    // Arrange
    const numValues = 10;
    const { instance: sourceArbitrary } = fakeArbitrary();
    const { instance } = fakeArbitrary();
    const CloneArbitrary = vi.spyOn(CloneArbitraryMock, 'CloneArbitrary');
    CloneArbitrary.mockImplementation(function () {
      return instance as CloneArbitraryMock.CloneArbitrary<unknown>;
    });

    // Act
    const arb = clone(sourceArbitrary, numValues);

    // Assert
    expect(CloneArbitrary).toHaveBeenCalledWith(sourceArbitrary, numValues);
    expect(arb).toBe(instance);
  });
});
