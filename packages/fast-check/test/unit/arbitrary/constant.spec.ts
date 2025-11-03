import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { constant } from '../../../src/arbitrary/constant';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import { cloneMethod } from '../../../src/check/symbols';

import * as ConstantArbitraryMock from '../../../src/arbitrary/_internals/ConstantArbitrary';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

describe('constant', () => {
  declareCleaningHooksForSpies();

  it('should instantiate ConstantArbitrary([c]) for constant(c)', () =>
    fc.assert(
      fc.property(fc.anything(), (c) => {
        // Arrange
        const { instance } = fakeArbitrary();
        const ConstantArbitrary = vi.spyOn(ConstantArbitraryMock, 'ConstantArbitrary');
        ConstantArbitrary.mockImplementation(function () {
          return instance as ConstantArbitraryMock.ConstantArbitrary<unknown>;
        } as any);

        // Act
        const arb = constant(c);

        // Assert
        expect(ConstantArbitrary).toHaveBeenCalledWith([c]);
        expect(arb).toBe(instance);
      }),
    ));

  it('should not throw on cloneable instance', () => {
    // Arrange
    const cloneable = { [cloneMethod]: () => cloneable };

    // Act / Assert
    expect(() => constant(cloneable)).not.toThrowError();
  });
});
