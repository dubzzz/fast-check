import { AddSymbol, HasSymbol, PoisoningFreeSet } from '../../src/internals/PoisoningFreeSet.js';

describe('PoisoningFreeSet', () => {
  it.each`
    originalName | symbol
    ${'add'}     | ${AddSymbol}
    ${'has'}     | ${HasSymbol}
  `('should only expose safe $originalName on the altered instances', ({ originalName, symbol }) => {
    // Arrange
    const originalMethod = (Set as any).prototype[originalName];

    try {
      // Act
      delete (Set as any).prototype[originalName]; // deleting original before calling toPoisoningFree*
      const newSet = PoisoningFreeSet.from();

      // Assert
      expect(symbol in newSet).toBe(true); // check symbol exists on output...
      expect((newSet as any)[symbol]).toBe(originalMethod);
      expect(newSet).toBeInstanceOf(Set);
      expect(symbol in new Set()).toBe(false); // ...but not on untouched ones...
      expect(symbol in Set.prototype).toBe(false);
      expect(originalName in new Set()).toBe(false); // ...and that source method has been properly dropped
    } finally {
      (Set as any).prototype[originalName] = originalMethod;
    }
  });
});
