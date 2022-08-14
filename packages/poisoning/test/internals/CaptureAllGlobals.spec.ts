import { captureAllGlobals } from '../../src/internals/CaptureAllGlobals.js';

describe('captureAllGlobals', () => {
  it.each`
    globalName                             | globalValue
    ${'Array'}                             | ${Array}
    ${'Array.prototype'}                   | ${Array.prototype}
    ${'Array.prototype.map'}               | ${Array.prototype.map}
    ${'Object'}                            | ${Object}
    ${'Object.entries'}                    | ${Object.entries}
    ${'Function'}                          | ${Function}
    ${'setTimeout'}                        | ${setTimeout}
    ${'Map.prototype[Symbol.toStringTag]'} | ${Map.prototype[Symbol.toStringTag]}
  `('should capture $globalName', ({ globalValue }) => {
    // Arrange / Act
    const globals = captureAllGlobals();

    // Assert
    const flattenGlobals = [...globals.values()].flatMap((globalDetails) =>
      [...globalDetails.properties.values()].map((property) => property.value)
    );
    expect(flattenGlobals).toContainEqual(globalValue);
  });
});
