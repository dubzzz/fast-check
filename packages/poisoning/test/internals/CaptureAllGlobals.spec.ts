import { captureAllGlobals } from '../../src/internals/CaptureAllGlobals.js';
import { PoisoningFreeSet } from '../../src/internals/PoisoningFreeSet.js';
import { GlobalDetails } from '../../src/internals/types/AllGlobals.js';

describe('captureAllGlobals', () => {
  const expectedGlobals = [
    {
      globalName: 'Array',
      globalValue: Array,
      expectedDepth: 1,
      expectedRoots: PoisoningFreeSet.from(['globalThis', 'Array']), // Array because Array.prototype.constructor
    },
    {
      globalName: 'Array.prototype',
      globalValue: Array.prototype,
      expectedDepth: 2,
      expectedRoots: PoisoningFreeSet.from(['Array']),
    },
    {
      globalName: 'Array.prototype.map',
      globalValue: Array.prototype.map,
      expectedDepth: 3,
      expectedRoots: PoisoningFreeSet.from(['Array']),
    },
    {
      globalName: 'Object',
      globalValue: Object,
      expectedDepth: 1,
      expectedRoots: PoisoningFreeSet.from(['globalThis', 'Object']), // Object because Object.prototype.constructor
    },
    {
      globalName: 'Object.entries',
      globalValue: Object.entries,
      expectedDepth: 2,
      expectedRoots: PoisoningFreeSet.from(['Object']),
    },
    {
      globalName: 'Function',
      globalValue: Function,
      expectedDepth: 1,
      expectedRoots: PoisoningFreeSet.from(['globalThis', 'Function']), // Function because Function.prototype.constructor
    },
    {
      globalName: 'Function.prototype.apply',
      globalValue: Function.prototype.apply,
      expectedDepth: 3,
      expectedRoots: PoisoningFreeSet.from(['Function']),
    },
    {
      globalName: 'Function.prototype.call',
      globalValue: Function.prototype.call,
      expectedDepth: 3,
      expectedRoots: PoisoningFreeSet.from(['Function']),
    },
    {
      globalName: 'setTimeout',
      globalValue: setTimeout,
      expectedDepth: 1,
      expectedRoots: PoisoningFreeSet.from(['globalThis', 'setTimeout']), // setTimeout because setTimeout.prototype.constructor
    },
    {
      globalName: 'Map.prototype[Symbol.toStringTag]',
      globalValue: Map.prototype[Symbol.toStringTag],
      expectedDepth: 3,
      expectedRoots: PoisoningFreeSet.from(['Map']),
      isSymbol: true,
    },
    {
      globalName: 'Object.prototype.toString',
      globalValue: Object.prototype.toString,
      expectedDepth: 3,
      expectedRoots: PoisoningFreeSet.from(['Object']),
    },
    {
      globalName: 'Number.prototype.toString', // not the same as Object one
      globalValue: Number.prototype.toString,
      expectedDepth: 3,
      expectedRoots: PoisoningFreeSet.from(['Number']),
    },
  ];
  // For the moment, internal data for globals linked to symbols is not tracked
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
    'should attach the right depth to $globalName',
    ({ globalValue, expectedDepth }) => {
      // Arrange / Act
      const globals = captureAllGlobals();

      // Assert
      expect(globals.get(globalValue)?.depth).toBe(expectedDepth);
    }
  );

  it.each(expectedGlobalsExcludingSymbols)(
    'should link $globalName to the right roots',
    ({ globalValue, expectedRoots }) => {
      // Arrange / Act
      const globals = captureAllGlobals();

      // Assert
      expect(globals.get(globalValue)?.rootAncestors).toEqual(expectedRoots);
    }
  );

  it('should attach the minimal depth from globalThis to each global', () => {
    // Arrange
    const dataB = { c: { d: 5 } };
    const dataA = { a: { b: dataB } };
    const dataC = { e: dataB };
    const dataD = { f: dataA, g: dataC, h: { i: { j: { k: { l: 1 } } } } };
    (globalThis as any).dataA = dataA;
    (globalThis as any).dataB = dataB;
    (globalThis as any).dataC = dataC;
    (globalThis as any).dataD = dataD;
    const expectedExtractedGlobalThis: GlobalDetails = {
      name: 'globalThis',
      depth: 0,
      properties: expect.any(Map),
      rootAncestors: PoisoningFreeSet.from(['globalThis']),
    };
    const expectedExtractedDataA: GlobalDetails = {
      name: 'dataA',
      depth: 1,
      properties: expect.any(Map),
      rootAncestors: PoisoningFreeSet.from(['globalThis', 'dataD']),
    };
    const expectedExtractedDataB: GlobalDetails = {
      name: 'dataB',
      depth: 1,
      properties: expect.any(Map),
      rootAncestors: PoisoningFreeSet.from(['globalThis', 'dataA', 'dataC']), // not dataD as it passes through other roots
    };
    const expectedExtractedDataC: GlobalDetails = {
      name: 'dataC',
      depth: 1,
      properties: expect.any(Map),
      rootAncestors: PoisoningFreeSet.from(['globalThis', 'dataD']),
    };
    const expectedExtractedDataD: GlobalDetails = {
      name: 'dataD',
      depth: 1,
      properties: expect.any(Map),
      rootAncestors: PoisoningFreeSet.from(['globalThis']),
    };
    const expectedExtractedC: GlobalDetails = {
      name: 'dataB.c', // shortest path to c
      depth: 2,
      properties: expect.any(Map),
      rootAncestors: PoisoningFreeSet.from(['dataB']),
    };
    const expectedExtractedK: GlobalDetails = {
      name: 'dataD.h.i.j.k', // shortest and only path to k
      depth: 5,
      properties: expect.any(Map),
      rootAncestors: PoisoningFreeSet.from(['dataD']),
    };

    try {
      // Act
      const globals = captureAllGlobals();

      // Assert
      const extractedGlobalThis = globals.get(globalThis);
      expect(extractedGlobalThis).toEqual(expectedExtractedGlobalThis);
      const extractedDataA = globals.get(dataA);
      expect(extractedDataA).toEqual(expectedExtractedDataA);
      const extractedDataB = globals.get(dataB);
      expect(extractedDataB).toEqual(expectedExtractedDataB);
      const extractedDataC = globals.get(dataC);
      expect(extractedDataC).toEqual(expectedExtractedDataC);
      const extractedDataD = globals.get(dataD);
      expect(extractedDataD).toEqual(expectedExtractedDataD);
      const extractedC = globals.get(dataB.c);
      expect(extractedC).toEqual(expectedExtractedC);
      const extractedK = globals.get(dataD.h.i.j.k);
      expect(extractedK).toEqual(expectedExtractedK);
    } finally {
      delete (globalThis as any).dataA;
      delete (globalThis as any).dataB;
      delete (globalThis as any).dataC;
      delete (globalThis as any).dataD;
    }
  });
});
