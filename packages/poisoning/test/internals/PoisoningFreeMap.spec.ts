import {
  EntriesSymbol,
  GetSymbol,
  HasSymbol,
  SetSymbol,
  PoisoningFreeMap,
} from '../../src/internals/PoisoningFreeMap.js';

describe('PoisoningFreeMap', () => {
  it.each`
    originalName | symbol
    ${'entries'} | ${EntriesSymbol}
    ${'get'}     | ${GetSymbol}
    ${'has'}     | ${HasSymbol}
    ${'set'}     | ${SetSymbol}
  `('should only expose safe $originalName on the altered instances', ({ originalName, symbol }) => {
    // Arrange
    const originalMethod = (Map as any).prototype[originalName];

    try {
      // Act
      delete (Map as any).prototype[originalName]; // deleting original before calling toPoisoningFree*
      const newMap = PoisoningFreeMap.from();

      // Assert
      expect(symbol in newMap).toBe(true); // check symbol exists on output...
      expect((newMap as any)[symbol]).toBe(originalMethod);
      expect(newMap).toBeInstanceOf(Map);
      expect(symbol in new Map()).toBe(false); // ...but not on untouched ones...
      expect(symbol in Map.prototype).toBe(false);
      expect(originalName in new Map()).toBe(false); // ...and that source method has been properly dropped
    } finally {
      (Map as any).prototype[originalName] = originalMethod;
    }
  });
});
