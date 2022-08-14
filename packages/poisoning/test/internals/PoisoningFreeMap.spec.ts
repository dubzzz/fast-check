import {
  EntriesSymbol,
  GetSymbol,
  HasSymbol,
  SetSymbol,
  toPoisoningFreeMap,
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
    const sourceMap = new Map<unknown, unknown>();

    try {
      // Act
      delete (Map as any).prototype[originalName]; // deleting original before calling toPoisoningFree*
      toPoisoningFreeMap(sourceMap);

      // Assert
      expect(symbol in sourceMap).toBe(true); // check symbol exists on altered instances...
      expect((sourceMap as any)[symbol]).toBe(originalMethod);
      expect(symbol in new Map()).toBe(false); // ...but not on untouched ones...
      expect(symbol in Map.prototype).toBe(false);
      expect(originalName in new Map()).toBe(false); // ...and that source method has been properly dropped
    } finally {
      (Map as any).prototype[originalName] = originalMethod;
    }
  });
});
