import * as fc from '../../../lib/fast-check';
import { constant } from '../../../src/arbitrary/constant';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';

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
        const { instance } = fakeNextArbitrary();
        const ConstantArbitrary = jest.spyOn(ConstantArbitraryMock, 'ConstantArbitrary');
        ConstantArbitrary.mockImplementation(() => instance as ConstantArbitraryMock.ConstantArbitrary<unknown>);

        // Act
        const arb = constant(c);

        // Assert
        expect(ConstantArbitrary).toHaveBeenCalledWith([c]);
        expect(convertToNext(arb)).toBe(instance);
      })
    ));
});
