import { captureAllGlobals } from '../../src/internals/CaptureAllGlobals.js';
import { toPoisoningFreeMap } from '../../src/internals/PoisoningFreeMap.js';
import { GlobalDetails } from '../../src/internals/types/AllGlobals.js';

describe('captureAllGlobals', () => {
  const expectedGlobals = [
    {
      globalName: 'Array',
      globalValue: Array,
      expectedRoots: ['globalThis'],
    },
    {
      globalName: 'Array.prototype',
      globalValue: Array.prototype,
      expectedRoots: ['globalThis', 'Array'],
    },
    {
      globalName: 'Array.prototype.map',
      globalValue: Array.prototype.map,
      expectedRoots: ['globalThis', 'Array'],
    },
    {
      globalName: 'Object',
      globalValue: Object,
      expectedRoots: ['globalThis'],
    },
    {
      globalName: 'Object.entries',
      globalValue: Object.entries,
      expectedRoots: ['globalThis', 'Object'],
    },
    {
      globalName: 'Function',
      globalValue: Function,
      expectedRoots: ['globalThis'],
    },
    {
      globalName: 'Function.prototype.apply',
      globalValue: Function.prototype.apply,
      expectedRoots: ['globalThis', 'Function'],
    },
    {
      globalName: 'Function.prototype.call',
      globalValue: Function.prototype.call,
      expectedRoots: ['globalThis', 'Function'],
    },
    {
      globalName: 'setTimeout',
      globalValue: setTimeout,
      expectedRoots: ['globalThis'],
    },
    {
      globalName: 'Map.prototype[Symbol.toStringTag]',
      globalValue: Map.prototype[Symbol.toStringTag],
      isSymbol: true,
      expectedRoots: ['globalThis', 'Map'],
    },
    {
      globalName: 'Object.prototype.toString',
      globalValue: Object.prototype.toString,
      expectedRoots: ['globalThis', 'Object'],
    },
    {
      globalName: 'Number.prototype.toString',
      globalValue: Number.prototype.toString,
      expectedRoots: ['globalThis', 'Number'],
    }, // not the same as Object one
  ];
  const expectedGlobalsExcludingSymbols = expectedGlobals.filter((item) => !item.isSymbol);

  it.each(expectedGlobals)('should capture value for $globalName', ({ globalValue }) => {
    // Arrange / Act
    const globals = captureAllGlobals();

    // Assert
    const flattenGlobalsValues = [...globals.values()].flatMap((globalDetails) =>
      [...globalDetails.properties.values()].map((property) => property.value)
    );
    expect(flattenGlobalsValues).toContainEqual(globalValue);
  });

  // For the moment, internal data for globals linked to symbols is not tracked
  it.each(expectedGlobalsExcludingSymbols)('should track the content of $globalName', ({ globalName, globalValue }) => {
    // Arrange / Act
    const globals = captureAllGlobals();

    // Assert
    const flattenGlobalsNames = [...globals.values()].map((globalDetails) => globalDetails.name);
    try {
      expect(flattenGlobalsNames).toContainEqual(globalName);
    } catch (err) {
      const flattenGlobalsValuesToName = new Map(
        [...globals.entries()].map(([globalDetailsValue, globalDetails]) => [globalDetailsValue, globalDetails.name])
      );
      if (flattenGlobalsValuesToName.has(globalValue)) {
        const associatedName = flattenGlobalsValuesToName.get(globalValue);
        const errorMessage = `Found value for ${globalName} attached to ${associatedName}`;
        throw new Error(errorMessage, { cause: err });
      }
      throw err;
    }
  });

  it.each(expectedGlobalsExcludingSymbols)(
    'should attach $globalName to the right parents',
    ({ globalName, expectedRoots }) => {
      // Arrange / Act
      const globals = captureAllGlobals();

      // Assert
      const globalEntry = [...globals.values()].find((globalDetails) => globalDetails.name === globalName);
      expect(globalEntry).toBeDefined();
      const allRootsForEntry = [...globalEntry!.topLevelRoots.keys()];
      for (const root of expectedRoots) {
        expect(allRootsForEntry).toContain(root);
      }
    }
  );

  it('should be able to attach multiple roots to the same instance', () => {
    // Arrange
    const shared = {
      a: 0,
      b: 1,
    };
    (globalThis as any).keyA = {
      keyB: {
        keyC: shared,
      },
    };
    (globalThis as any).keyD = {
      keyE: shared,
    };

    try {
      // Act
      const globals = captureAllGlobals();

      // Assert
      const sharedEntry = [...globals.entries()].find(([globalValue]) => globalValue === shared);
      expect(sharedEntry).toBeDefined();
      const rootsForShared = [...sharedEntry![1].topLevelRoots.keys()];
      expect(rootsForShared).toContain('keyA');
      expect(rootsForShared).toContain('keyD');
    } finally {
      delete (globalThis as any).keyA;
      delete (globalThis as any).keyD;
    }
  });

  it('should attach the minimal depth from globalThis to each global', () => {
    // Arrange
    const dataB = { c: { d: 5 } };
    const dataA = { a: { b: dataB } };
    const dataC = { e: dataB };
    (globalThis as any).dataA = dataA;
    (globalThis as any).dataB = dataB;
    (globalThis as any).dataC = dataC;
    const expectedExtractedDataA: GlobalDetails = {
      name: 'dataA',
      properties: expect.any(Map),
      depth: 1,
      topLevelRoots: toPoisoningFreeMap(new Map([['globalThis', true]])),
    };
    const expectedExtractedDataB: GlobalDetails = {
      name: 'dataB',
      properties: expect.any(Map),
      depth: 1,
      topLevelRoots: toPoisoningFreeMap(
        new Map([
          ['globalThis', true], // for depth 1 and depth 0, any root leading to it
          ['dataA', true],
          ['dataC', true],
        ])
      ),
    };
    const expectedExtractedDataC: GlobalDetails = {
      name: 'dataC',
      properties: expect.any(Map),
      depth: 1,
      topLevelRoots: toPoisoningFreeMap(new Map([['globalThis', true]])),
    };
    const expectedExtractedD: GlobalDetails = {
      name: 'd',
      properties: expect.any(Map),
      depth: 1,
      topLevelRoots: toPoisoningFreeMap(
        new Map([
          ['dataB', true], // for depth >1 only owned by roots
        ])
      ),
    };

    try {
      // Act
      const globals = captureAllGlobals();

      // Assert
      const extractedDataA = globals.get(dataA);
      expect(extractedDataA).toEqual(expect.objectContaining(expectedExtractedDataA));
      const extractedDataB = globals.get(dataB);
      const extractedDataC = globals.get(dataC);
      const extractedD = globals.get(dataB.c.d);
    } finally {
      delete (globalThis as any).dataA;
      delete (globalThis as any).dataB;
      delete (globalThis as any).dataC;
    }
  });
});
