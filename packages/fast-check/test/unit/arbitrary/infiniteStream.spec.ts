import { beforeEach, describe, it, expect, vi } from 'vitest';
import { infiniteStream } from '../../../src/arbitrary/infiniteStream';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as StreamArbitraryMock from '../../../src/arbitrary/_internals/StreamArbitrary';

function beforeEachHook() {
  vi.resetModules();
  vi.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('infiniteStream', () => {
  it('should instantiate StreamArbitrary(arb, numValues) for infiniteStream(arb)', () => {
    // Arrange
    const { instance: sourceArbitrary } = fakeArbitrary();
    const { instance } = fakeArbitrary();
    const StreamArbitrary = vi.spyOn(StreamArbitraryMock, 'StreamArbitrary');
    StreamArbitrary.mockImplementation(() => instance as StreamArbitraryMock.StreamArbitrary<unknown>);

    // Act
    const arb = infiniteStream(sourceArbitrary);

    // Assert
    expect(StreamArbitrary).toHaveBeenCalledWith(sourceArbitrary);
    expect(arb).toBe(instance);
  });
});
