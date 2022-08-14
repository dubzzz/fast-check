import { MapSymbol, PushSymbol, SortSymbol, toPoisoningFreeArray } from '../../src/internals/PoisoningFreeArray.js';

describe('PoisoningFreeArray', () => {
  it.each`
    originalName | symbol
    ${'map'}     | ${MapSymbol}
    ${'push'}    | ${PushSymbol}
    ${'sort'}    | ${SortSymbol}
  `('should only expose safe $originalName on the altered instances', ({ originalName, symbol }) => {
    // Arrange
    const originalMethod = Array.prototype[originalName];
    const sourceArray = [1, 2];

    try {
      // Act
      delete Array.prototype[originalName]; // deleting original before calling toPoisoningFree*
      toPoisoningFreeArray(sourceArray);

      // Assert
      expect(symbol in sourceArray).toBe(true); // check symbol exists on altered instances...
      expect(sourceArray[symbol]).toBe(originalMethod);
      expect(symbol in []).toBe(false); // ...but not on untouched ones...
      expect(symbol in Array.prototype).toBe(false);
      expect(originalName in []).toBe(false); // ...and that source method has been properly dropped
    } finally {
      Array.prototype[originalName] = originalMethod;
    }
  });
});
