import * as fc from 'fast-check';
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
  it('should instantiate StreamArbitrary(arb, true) for infiniteStream(arb)', () => {
    // Arrange
    const { instance: sourceArbitrary } = fakeArbitrary();
    const { instance } = fakeArbitrary();
    const StreamArbitrary = vi.spyOn(StreamArbitraryMock, 'StreamArbitrary');
    StreamArbitrary.mockImplementation(function() { return instance as StreamArbitraryMock.StreamArbitrary<unknown>; } as any);

    // Act
    const arb = infiniteStream(sourceArbitrary);

    // Assert
    expect(StreamArbitrary).toHaveBeenCalledWith(sourceArbitrary, true);
    expect(arb).toBe(instance);
  });

  it('should instantiate StreamArbitrary(arb, !noHistory) for infiniteStream(arb, { noHistory })', () => {
    fc.assert(
      fc.property(fc.boolean(), (history) => {
        // Arrange
        const { instance: sourceArbitrary } = fakeArbitrary();
        const { instance } = fakeArbitrary();
        const StreamArbitrary = vi.spyOn(StreamArbitraryMock, 'StreamArbitrary');
        StreamArbitrary.mockImplementation(function() { return instance as StreamArbitraryMock.StreamArbitrary<unknown>; } as any);

        // Act
        const arb = infiniteStream(sourceArbitrary, { noHistory: !history });

        // Assert
        expect(StreamArbitrary).toHaveBeenCalledWith(sourceArbitrary, history);
        expect(arb).toBe(instance);
      }),
    );
  });
});
