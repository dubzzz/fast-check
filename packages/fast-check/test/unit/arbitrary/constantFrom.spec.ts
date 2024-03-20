import * as fc from 'fast-check';
import { constantFrom } from '../../../src/arbitrary/constantFrom';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import { cloneMethod } from '../../../src/check/symbols';

import * as ConstantArbitraryMock from '../../../src/arbitrary/_internals/ConstantArbitrary';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('constantFrom', () => {
  it('should instantiate ConstantArbitrary(csts) for constantFrom(...csts)', () =>
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 1 }), (csts) => {
        // Arrange
        const { instance } = fakeArbitrary();
        const ConstantArbitrary = jest.spyOn(ConstantArbitraryMock, 'ConstantArbitrary');
        ConstantArbitrary.mockImplementation(() => instance as ConstantArbitraryMock.ConstantArbitrary<unknown>);

        // Act
        const arb = constantFrom(...csts);

        // Assert
        expect(ConstantArbitrary).toHaveBeenCalledWith(csts);
        expect(arb).toBe(instance);
      }),
    ));

  it('should throw when receiving no parameters', () => {
    // Arrange / Act / Assert
    expect(() => constantFrom()).toThrowErrorMatchingInlineSnapshot('"fc.constantFrom expects at least one parameter"');
  });

  it('should not throw on cloneable instance', () => {
    // Arrange
    const cloneable = { [cloneMethod]: () => cloneable };

    // Act / Assert
    expect(() => constantFrom(cloneable)).not.toThrowError();
  });
});
