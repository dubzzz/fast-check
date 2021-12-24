import * as fc from '../../../../../lib/fast-check';
import { CustomEqualSet } from '../../../../../src/arbitrary/_internals/helpers/CustomEqualSet';

describe('CustomEqualSet', () => {
  it('should discard equivalent items', () => {
    // Arrange
    const compare = (a: { label: string; size: number }, b: { label: string; size: number }) => a.label === b.label;
    const s = new CustomEqualSet(compare);

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
      fc.property(fc.array(fc.anything(), { minLength: 1 }), fc.compareBooleanFunc(), (rawItems, compare) => {
        // Arrange
        let expectedSize = 0;
        const s = new CustomEqualSet(compare);

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
      fc.property(fc.array(fc.anything(), { minLength: 2 }), fc.compareBooleanFunc(), (rawItems, compare) => {
        // Arrange
        const s = new CustomEqualSet(compare);

        // Act
        for (const item of rawItems) {
          s.tryAdd(item);
        }
        const data = s.getData();

        // Assert
        for (let i = 0; i !== data.length; ++i) {
          for (let j = i + 1; j !== data.length; ++j) {
            expect(compare(data[i], data[j])).toBe(false);
          }
        }
      })
    );
  });

  it('should preserve add order', () => {
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 2 }), fc.compareBooleanFunc(), (rawItems, compare) => {
        // Arrange
        const s = new CustomEqualSet(compare);

        // Act
        for (const item of rawItems) {
          s.tryAdd(item);
        }
        const data = s.getData();

        // Assert
        for (let i = 1; i <= data.length; ++i) {
          const indexPrevious = rawItems.findIndex((item) => compare(item, data[i - 1]));
          const indexCurrent = rawItems.findIndex((item) => compare(item, data[i]));
          expect(indexPrevious).not.toBe(-1);
          expect(indexCurrent).not.toBe(-1);
          expect(indexPrevious).toBeLessThan(indexCurrent);
        }
      })
    );
  });
});
