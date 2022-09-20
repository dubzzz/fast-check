import { clone } from '../../../src/arbitrary/clone';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as CloneArbitraryMock from '../../../src/arbitrary/_internals/CloneArbitrary';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('clone', () => {
  it('should instantiate CloneArbitrary(arb, numValues) for clone(arb, numValues)', () => {
    // Arrange
    const numValues = 10;
    const { instance: sourceArbitrary } = fakeArbitrary();
    const { instance } = fakeArbitrary();
    const CloneArbitrary = jest.spyOn(CloneArbitraryMock, 'CloneArbitrary');
    CloneArbitrary.mockImplementation(() => instance as CloneArbitraryMock.CloneArbitrary<unknown>);

    // Act
    const arb = clone(sourceArbitrary, numValues);

    // Assert
    expect(CloneArbitrary).toHaveBeenCalledWith(sourceArbitrary, numValues);
    expect(arb).toBe(instance);
  });
});
