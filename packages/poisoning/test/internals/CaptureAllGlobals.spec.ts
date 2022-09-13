import { captureAllGlobals } from '../../src/internals/CaptureAllGlobals.js';
import { GlobalDetails } from '../../src/internals/types/AllGlobals.js';

describe('captureAllGlobals', () => {
  const expectedGlobals = [
    { globalName: 'Array', globalValue: Array },
    { globalName: 'Array.prototype', globalValue: Array.prototype },
    { globalName: 'Array.prototype.map', globalValue: Array.prototype.map },
    { globalName: 'Object', globalValue: Object },
    { globalName: 'Object.entries', globalValue: Object.entries },
    { globalName: 'Function', globalValue: Function },
    { globalName: 'Function.prototype.apply', globalValue: Function.prototype.apply },
    { globalName: 'Function.prototype.call', globalValue: Function.prototype.call },
    { globalName: 'setTimeout', globalValue: setTimeout },
    { globalName: 'Map.prototype[Symbol.toStringTag]', globalValue: Map.prototype[Symbol.toStringTag], isSymbol: true },
    { globalName: 'Object.prototype.toString', globalValue: Object.prototype.toString },
    { globalName: 'Number.prototype.toString', globalValue: Number.prototype.toString }, // not the same as Object one
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
    };
    const expectedExtractedDataA: GlobalDetails = {
      name: 'dataA',
      depth: 1,
      properties: expect.any(Map),
    };
    const expectedExtractedDataB: GlobalDetails = {
      name: 'dataB',
      depth: 1,
      properties: expect.any(Map),
    };
    const expectedExtractedDataC: GlobalDetails = {
      name: 'dataC',
      depth: 1,
      properties: expect.any(Map),
    };
    const expectedExtractedDataD: GlobalDetails = {
      name: 'dataD',
      depth: 1,
      properties: expect.any(Map),
    };
    const expectedExtractedC: GlobalDetails = {
      name: 'dataB.c', // shortest path to c
      depth: 2,
      properties: expect.any(Map),
    };
    const expectedExtractedK: GlobalDetails = {
      name: 'dataD.h.i.j.k', // shortest and only path to k
      depth: 5,
      properties: expect.any(Map),
    };

    try {
      // Act
      const globals = captureAllGlobals();

      // Assert
      const extractedGlobalThis = globals.get(globalThis);
      expect(extractedGlobalThis).toEqual(expect.objectContaining(expectedExtractedGlobalThis));
      const extractedDataA = globals.get(dataA);
      expect(extractedDataA).toEqual(expect.objectContaining(expectedExtractedDataA));
      const extractedDataB = globals.get(dataB);
      expect(extractedDataB).toEqual(expect.objectContaining(expectedExtractedDataB));
      const extractedDataC = globals.get(dataC);
      expect(extractedDataC).toEqual(expect.objectContaining(expectedExtractedDataC));
      const extractedDataD = globals.get(dataD);
      expect(extractedDataD).toEqual(expect.objectContaining(expectedExtractedDataD));
      const extractedC = globals.get(dataB.c);
      expect(extractedC).toEqual(expect.objectContaining(expectedExtractedC));
      const extractedK = globals.get(dataD.h.i.j.k);
      expect(extractedK).toEqual(expect.objectContaining(expectedExtractedK));
    } finally {
      delete (globalThis as any).dataA;
      delete (globalThis as any).dataB;
      delete (globalThis as any).dataC;
      delete (globalThis as any).dataD;
    }
  });
});
