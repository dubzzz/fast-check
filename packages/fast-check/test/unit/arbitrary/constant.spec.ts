import * as fc from '../../../lib/fast-check';
import { constant } from '../../../src/arbitrary/constant';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import { cloneMethod } from '../../../src/check/symbols';

import * as ConstantArbitraryMock from '../../../src/arbitrary/_internals/ConstantArbitrary';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('constant', () => {
  it('should instantiate ConstantArbitrary([c]) for constant(c)', () =>
    fc.assert(
      fc.property(fc.anything(), (c) => {
        // Arrange
        const { instance } = fakeArbitrary();
        const ConstantArbitrary = jest.spyOn(ConstantArbitraryMock, 'ConstantArbitrary');
        ConstantArbitrary.mockImplementation(() => instance as ConstantArbitraryMock.ConstantArbitrary<unknown>);

        // Act
        const arb = constant(c);

        // Assert
        expect(ConstantArbitrary).toHaveBeenCalledWith([c]);
        expect(arb).toBe(instance);
      })
    ));

  it('should not throw on cloneable instance', () => {
    // Arrange
    const cloneable = { [cloneMethod]: () => cloneable };

    // Act / Assert
    expect(() => constant(cloneable)).not.toThrowError();
  });
});
