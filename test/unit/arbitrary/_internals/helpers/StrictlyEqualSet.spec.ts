import * as fc from '../../../../../lib/fast-check';
import { StrictyEqualSet } from '../../../../../src/arbitrary/_internals/helpers/StrictlyEqualSet';

describe('StrictyEqualSet', () => {
  it('should discard strictly equal items', () => {
    // Arrange
    const s = new StrictyEqualSet((item) => item);

    // Arrange / Act
    expect(s.tryAdd(1)).toBe(true);
    expect(s.tryAdd(5)).toBe(true);
    expect(s.tryAdd(-0)).toBe(true);
    expect(s.tryAdd(0)).toBe(false);
    expect(s.tryAdd(Number.NaN)).toBe(true);
    expect(s.tryAdd(Number.NaN)).toBe(true);
    expect(s.tryAdd(1)).toBe(false);
    expect(s.tryAdd(5)).toBe(false);
    expect(s.tryAdd(6)).toBe(true);
    expect(s.tryAdd('6')).toBe(true);
    expect(s.getData()).toEqual([1, 5, -0, Number.NaN, Number.NaN, 6, '6']);
  });

  it('should discard strictly equal items after selector', () => {
    // Arrange
    const s = new StrictyEqualSet((item: { value?: unknown }) => item.value);

    // Arrange / Act
    expect(s.tryAdd({ value: 1 })).toBe(true);
    expect(s.tryAdd({ value: 5 })).toBe(true);
    expect(s.tryAdd({ value: -0 })).toBe(true);
    expect(s.tryAdd({ value: 0 })).toBe(false);
    expect(s.tryAdd({ value: Number.NaN })).toBe(true);
    expect(s.tryAdd({ value: Number.NaN })).toBe(true);
    expect(s.tryAdd({ value: 1 })).toBe(false);
    expect(s.tryAdd({ value: 5 })).toBe(false);
    expect(s.tryAdd({ value: 6 })).toBe(true);
    expect(s.tryAdd({ value: '6' })).toBe(true);
    expect(s.tryAdd({})).toBe(true);
    expect(s.tryAdd({ value: undefined })).toBe(false);
    expect(s.getData()).toEqual([
      { value: 1 },
      { value: 5 },
      { value: -0 },
      { value: Number.NaN },
      { value: Number.NaN },
      { value: 6 },
      { value: '6' },
      {},
    ]);
  });

  it('should increase the size whenever tryAdd returns true', () => {
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 1 }), (rawItems) => {
        // Arrange
        let expectedSize = 0;
        const s = new StrictyEqualSet((item) => item);

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
      fc.property(fc.array(fc.anything(), { minLength: 2 }), (rawItems) => {
        // Arrange
        const s = new StrictyEqualSet((item) => item);

        // Act
        for (const item of rawItems) {
          s.tryAdd(item);
        }
        const data = s.getData();

        // Assert
        for (let i = 0; i !== data.length; ++i) {
          for (let j = i + 1; j !== data.length; ++j) {
            expect(data[i] === data[j]).toBe(false);
          }
        }
      })
    );
  });

  it('should preserve add order', () => {
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 2 }), (rawItems) => {
        // Arrange
        const s = new StrictyEqualSet((item) => item);

        // Act
        for (const item of rawItems) {
          s.tryAdd(item);
        }
        const data = s.getData();

        // Assert
        for (let i = 1; i < data.length; ++i) {
          const indexPrevious = rawItems.findIndex((item) => item === data[i - 1]);
          const indexCurrent = rawItems.findIndex((item) => item === data[i]);
          expect(indexPrevious).not.toBe(-1);
          expect(indexCurrent).not.toBe(-1);
          expect(indexPrevious).toBeLessThan(indexCurrent);
        }
      })
    );
  });
});
