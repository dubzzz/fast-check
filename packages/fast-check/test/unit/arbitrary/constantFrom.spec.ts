import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { constantFrom } from '../../../src/arbitrary/constantFrom.js';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers.js';
import { cloneMethod } from '../../../src/check/symbols.js';

import * as ConstantArbitraryMock from '../../../src/arbitrary/_internals/ConstantArbitrary.js';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner.js';

describe('constantFrom', () => {
  declareCleaningHooksForSpies();

  it('should instantiate ConstantArbitrary(csts) for constantFrom(...csts)', () =>
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 1 }), (csts) => {
        // Arrange
        const { instance } = fakeArbitrary();
        const ConstantArbitrary = vi.spyOn(ConstantArbitraryMock, 'ConstantArbitrary');
        ConstantArbitrary.mockImplementation(function () {
          return instance as ConstantArbitraryMock.ConstantArbitrary<unknown>;
        });

        // Act
        const arb = constantFrom(...csts);

        // Assert
        expect(ConstantArbitrary).toHaveBeenCalledWith(csts);
        expect(arb).toBe(instance);
      }),
    ));

  it('should throw when receiving no parameters', () => {
    // Arrange / Act / Assert
    expect(() => constantFrom()).toThrowErrorMatchingInlineSnapshot(
      `[Error: fc.constantFrom expects at least one parameter]`,
    );
  });

  it('should not throw on cloneable instance', () => {
    // Arrange
    const cloneable = { [cloneMethod]: () => cloneable };

    // Act / Assert
    expect(() => constantFrom(cloneable)).not.toThrowError();
  });
});
