import { captureAllGlobals } from '../../src/internals/CaptureAllGlobals.js';

describe('captureAllGlobals', () => {
  it.each`
    globalName               | globalValue
    ${'Array'}               | ${Array}
    ${'Array.prototype'}     | ${Array.prototype}
    ${'Array.prototype.map'} | ${Array.prototype.map}
    ${'Function'}            | ${Function}
    ${'setTimeout'}          | ${setTimeout}
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
