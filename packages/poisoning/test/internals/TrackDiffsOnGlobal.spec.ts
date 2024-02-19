import { PoisoningFreeMap } from '../../src/internals/PoisoningFreeMap.js';
import { PoisoningFreeSet } from '../../src/internals/PoisoningFreeSet.js';
import { trackDiffsOnGlobals } from '../../src/internals/TrackDiffsOnGlobal.js';
import type { AllGlobals, GlobalDetails } from '../../src/internals/types/AllGlobals.js';

describe('trackDiffsOnGlobals', () => {
  it('should detect added entries', () => {
    // Arrange
    const globalA: any = {};
    const allGlobals: AllGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>([
      [globalA, extractGlobalDetailsFor('globalA', globalA)],
    ]);
    globalA.a = 2; // adding key onto a tracked global

    // Act
    const diff = trackDiffsOnGlobals(
      allGlobals,
      () => true,
      () => true,
    );
    expect(globalA).not.toEqual({});
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({
      type: 'added',
      keyName: 'a',
      fullyQualifiedKeyName: 'globalA.a',
      patch: expect.any(Function),
      globalDetails: expect.anything(),
    });
    expect(globalA).toEqual({});
  });

  it('should detect added symbols entries', () => {
    // Arrange
    const addedSymbol = Symbol('my-symbol');
    const globalA: any = {};
    const allGlobals: AllGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>([
      [globalA, extractGlobalDetailsFor('globalA', globalA)],
    ]);
    globalA[addedSymbol] = 2; // adding key onto a tracked global

    // Act
    const diff = trackDiffsOnGlobals(
      allGlobals,
      () => true,
      () => true,
    );
    expect(globalA).not.toEqual({});
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({
      type: 'added',
      keyName: 'Symbol(my-symbol)',
      fullyQualifiedKeyName: 'globalA.Symbol(my-symbol)',
      patch: expect.any(Function),
      globalDetails: expect.anything(),
    });
    expect(globalA).toEqual({});
  });

  it('should detect added non-enumerable entries', () => {
    // Arrange
    const globalA: any = {};
    const allGlobals: AllGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>([
      [globalA, extractGlobalDetailsFor('globalA', globalA)],
    ]);
    Object.defineProperty(globalA, 'a', { configurable: true, enumerable: false, writable: false, value: 2 }); // adding key onto a tracked global

    // Act
    const diff = trackDiffsOnGlobals(
      allGlobals,
      () => true,
      () => true,
    );
    expect('a' in globalA).toBe(true);
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({
      type: 'added',
      keyName: 'a',
      fullyQualifiedKeyName: 'globalA.a',
      patch: expect.any(Function),
      globalDetails: expect.anything(),
    });
    expect('a' in globalA).toBe(false);
  });

  it('should detect removed entries', () => {
    // Arrange
    const globalA: any = { a: 2 };
    const allGlobals: AllGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>([
      [globalA, extractGlobalDetailsFor('globalA', globalA)],
    ]);
    delete globalA.a; // deleting key from a tracked global

    // Act
    const diff = trackDiffsOnGlobals(
      allGlobals,
      () => true,
      () => true,
    );
    expect(globalA).not.toEqual({ a: 2 });
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({
      type: 'removed',
      keyName: 'a',
      fullyQualifiedKeyName: 'globalA.a',
      patch: expect.any(Function),
      globalDetails: expect.anything(),
    });
    expect(globalA).toEqual({ a: 2 });
  });

  it('should detect changed entries', () => {
    // Arrange
    const globalA: any = { a: 2 };
    const allGlobals: AllGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>([
      [globalA, extractGlobalDetailsFor('globalA', globalA)],
    ]);
    globalA.a = 3; // updating value linked to a key from a tracked global

    // Act
    const diff = trackDiffsOnGlobals(
      allGlobals,
      () => true,
      () => true,
    );
    expect(globalA).not.toEqual({ a: 2 });
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({
      type: 'changed',
      keyName: 'a',
      fullyQualifiedKeyName: 'globalA.a',
      patch: expect.any(Function),
      globalDetails: expect.anything(),
    });
    expect(globalA).toEqual({ a: 2 });
  });

  it('should detect deleted own entries still existing thanks to prototype', () => {
    // Arrange
    class BaseA {
      hello() {}
    }
    const helloOverride = () => {};
    const globalA = new BaseA();
    globalA.hello = helloOverride; // 'a' now defines 'hello' as one of its own properties
    const allGlobals: AllGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>([
      [globalA, extractGlobalDetailsFor('globalA', globalA)],
    ]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete globalA.hello; // deleting hello from globalA but globalA.hello can still be called (prototype call)

    // Act
    const diff = trackDiffsOnGlobals(
      allGlobals,
      () => true,
      () => true,
    );
    expect(globalA).not.toEqual({ hello: helloOverride });
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff).toContainEqual({
      type: 'removed',
      keyName: 'hello',
      fullyQualifiedKeyName: 'globalA.hello',
      patch: expect.any(Function),
      globalDetails: expect.anything(),
    });
    expect(globalA).toEqual({ hello: helloOverride });
  });

  it('should skip global when not eligible even when it contains changed entries', () => {
    // Arrange
    const globalA: any = { a: 2 };
    const globalB: any = { b: 2 };
    const allGlobals: AllGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>([
      [globalA, extractGlobalDetailsFor('globalA', globalA)],
      [globalB, extractGlobalDetailsFor('globalB', globalB)],
    ]);
    globalA.a = 3; // updating value linked to a key from a tracked global
    globalB.b = 3;

    // Act
    const diff = trackDiffsOnGlobals(
      allGlobals,
      (g) => g.name !== 'globalA', // globalA not eligible for tracking
      () => true,
    );
    expect(globalA).not.toEqual({ a: 2 });
    expect(globalB).not.toEqual({ b: 2 });
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff[0].fullyQualifiedKeyName).toBe('globalB.b');
    expect(globalA).toEqual({ a: 3 }); // no patch applied
    expect(globalB).toEqual({ b: 2 }); // patched
  });

  it('should skip entry when not eligible even when it possibly changed', () => {
    // Arrange
    const globalA: any = { a: 2, b: 2 };
    const allGlobals: AllGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>([
      [globalA, extractGlobalDetailsFor('globalA', globalA)],
    ]);
    globalA.a = 3; // updating value linked to a key from a tracked global
    globalA.b = 3;

    // Act
    const diff = trackDiffsOnGlobals(
      allGlobals,
      () => true,
      (_g, p) => p !== 'a', // property a not eligible for tracking
    );
    expect(globalA).not.toEqual({ a: 2, b: 2 });
    diff.forEach((d) => d.patch());

    // Assert
    expect(diff).toHaveLength(1);
    expect(diff[0].fullyQualifiedKeyName).toBe('globalA.b');
    expect(globalA).toEqual({ a: 3, b: 2 }); // no patch applied for a
  });
});

// Helpers

function extractGlobalDetailsFor(itemName: string, item: unknown): GlobalDetails {
  return {
    name: itemName,
    depth: 0,
    properties: PoisoningFreeMap.from(
      [...Object.getOwnPropertyNames(item), ...Object.getOwnPropertySymbols(item)].map((keyName) => [
        keyName,
        Object.getOwnPropertyDescriptor(item, keyName)!,
      ]),
    ),
    rootAncestors: PoisoningFreeSet.from(['globalThis']),
  };
}
