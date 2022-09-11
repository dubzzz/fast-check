import { captureAllGlobals } from '../../src/internals/CaptureAllGlobals.js';

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
});
