import { MapSymbol, PushSymbol, SortSymbol, PoisoningFreeArray } from '../../src/internals/PoisoningFreeArray.js';

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
      const newArray = PoisoningFreeArray.from(sourceArray);

      // Assert
      expect(symbol in newArray).toBe(true); // check symbol exists on output...
      expect(newArray[symbol]).toBe(originalMethod);
      expect(newArray).toBeInstanceOf(Array);
      expect(symbol in sourceArray).toBe(false); // ...but did not altered received instances...
      expect(sourceArray[symbol]).toBe(undefined);
      expect(symbol in []).toBe(false); // ...nor future instances...
      expect(symbol in Array.prototype).toBe(false);
      expect(originalName in []).toBe(false); // ...and that source method has been properly dropped
    } finally {
      Array.prototype[originalName] = originalMethod;
    }
  });
});
