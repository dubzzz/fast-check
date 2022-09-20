import * as fc from 'fast-check';
import { CustomEqualSet } from '../../../../../src/arbitrary/_internals/helpers/CustomEqualSet';

describe('CustomEqualSet', () => {
  it('should discard equivalent items', () => {
    // Arrange
    const isEqual = (a: { label: string; size: number }, b: { label: string; size: number }) => a.label === b.label;
    const s = new CustomEqualSet(isEqual);

    // Arrange / Act
    expect(s.tryAdd({ label: 'toto', size: 5 })).toBe(true);
    expect(s.tryAdd({ label: 'titi', size: 6 })).toBe(true);
    expect(s.tryAdd({ label: 'toto', size: 7 })).toBe(false);
    expect(s.tryAdd({ label: 'tata', size: 8 })).toBe(true);
    expect(s.getData()).toEqual([
      { label: 'toto', size: 5 },
      { label: 'titi', size: 6 },
      { label: 'tata', size: 8 },
    ]);
  });

  it('should increase the size whenever tryAdd returns true', () => {
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 1 }), isEqualFuncArb(), (rawItems, isEqual) => {
        // Arrange
        let expectedSize = 0;
        const s = new CustomEqualSet(isEqual);

        // Act / Assert
        for (const item of rawItems) {
          if (s.tryAdd(item)) {
            expectedSize += 1;
          }
          expect(s.size()).toBe(expectedSize);
        }
      })
    );
  });

  it('should never have two equivalent items in the Set', () => {
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 2 }), isEqualFuncArb(), (rawItems, isEqual) => {
        // Arrange
        const s = new CustomEqualSet(isEqual);

        // Act
        for (const item of rawItems) {
          s.tryAdd(item);
        }
        const data = s.getData();

        // Assert
        for (let i = 0; i !== data.length; ++i) {
          for (let j = i + 1; j !== data.length; ++j) {
            expect(isEqual(data[i], data[j])).toBe(false);
          }
        }
      })
    );
  });

  it('should preserve add order', () => {
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 2 }), isEqualFuncArb(), (rawItems, isEqual) => {
        // Arrange
        const s = new CustomEqualSet(isEqual);

        // Act
        for (const item of rawItems) {
          s.tryAdd(item);
        }
        const data = s.getData();

        // Assert
        for (let i = 1; i < data.length; ++i) {
          const indexPrevious = rawItems.findIndex((item) => isEqual(item, data[i - 1]));
          const indexCurrent = rawItems.findIndex((item) => isEqual(item, data[i]));
          expect(indexPrevious).not.toBe(-1);
          expect(indexCurrent).not.toBe(-1);
          expect(indexPrevious).toBeLessThan(indexCurrent);
        }
      })
    );
  });
});

// Helpers

function isEqualFuncArb() {
  return fc.compareFunc().map((f) => (a: unknown, b: unknown) => f(a, b) === 0);
}
