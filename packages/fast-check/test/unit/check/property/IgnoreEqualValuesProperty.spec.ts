import { IgnoreEqualValuesProperty } from '../../../../src/check/property/IgnoreEqualValuesProperty';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { fakeProperty } from './__test-helpers__/PropertyHelpers';

describe.each([[true], [false]])('IgnoreEqualValuesProperty (dontRunHook: $dontRunHook)', (dontRunHook) => {
  it.each`
    skipRuns
    ${false}
    ${true}
  `('should not call run on the decorated property when property is run on the same value', ({ skipRuns }) => {
    // Arrange
    const { instance: decoratedProperty, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const property = new IgnoreEqualValuesProperty(decoratedProperty, skipRuns);
    if (dontRunHook) {
      property.runBeforeEach!();
      property.run(1, true);
      property.runAfterEach!();
      property.runBeforeEach!();
      property.run(1, true);
      property.runAfterEach!();
    } else {
      property.run(1, false);
      property.run(1, false);
    }

    // Assert
    expect(run).toHaveBeenCalledTimes(1);
    expect(runBeforeEach).toHaveBeenCalledTimes(2);
    expect(runAfterEach).toHaveBeenCalledTimes(2);
  });

  it.each`
    originalValue                           | originalValuePretty            | isAsync
    ${null /* success */}                   | ${'null'}                      | ${false}
    ${'error' /* failure */}                | ${'"error"'}                   | ${false}
    ${new PreconditionFailure() /* skip */} | ${'new PreconditionFailure()'} | ${false}
    ${null /* success */}                   | ${'null'}                      | ${true}
    ${'error' /* failure */}                | ${'"error"'}                   | ${true}
    ${new PreconditionFailure() /* skip */} | ${'new PreconditionFailure()'} | ${true}
  `(
    'should always return the cached value for skipRuns=false, originalValue=$originalValuePretty, isAsync=$isAsync',
    ({ originalValue, isAsync }) => {
      // Arrange
      // success -> success
      // failure -> failure
      // skip    -> skip
      const { instance: decoratedProperty, run } = fakeProperty(isAsync);
      run.mockImplementation(() => (isAsync ? Promise.resolve(originalValue) : originalValue));

      // Act
      const property = new IgnoreEqualValuesProperty(decoratedProperty, false);
      let initialRunOutput: ReturnType<typeof property.run>;
      let secondRunOutput: ReturnType<typeof property.run>;
      if (dontRunHook) {
        property.runBeforeEach!();
        initialRunOutput = property.run(null, true);
        property.runAfterEach!();
        property.runBeforeEach!();
        secondRunOutput = property.run(null, true);
        property.runAfterEach!();
      } else {
        initialRunOutput = property.run(null, false);
        secondRunOutput = property.run(null, false);
      }

      // Assert
      expect(secondRunOutput).toBe(initialRunOutput);
    }
  );

  it.each`
    originalValue                           | originalValuePretty            | isAsync
    ${null /* success */}                   | ${'null'}                      | ${false}
    ${'error' /* failure */}                | ${'"error"'}                   | ${false}
    ${new PreconditionFailure() /* skip */} | ${'new PreconditionFailure()'} | ${false}
    ${null /* success */}                   | ${'null'}                      | ${true}
    ${'error' /* failure */}                | ${'"error"'}                   | ${true}
    ${new PreconditionFailure() /* skip */} | ${'new PreconditionFailure()'} | ${true}
  `(
    'should return the cached value but skip success for skipRuns=true, originalValue=$originalValuePretty, isAsync=$isAsync',
    async ({ originalValue, isAsync }) => {
      // Arrange
      // success -> skip
      // failure -> failure
      // skip    -> skip
      const { instance: decoratedProperty, run } = fakeProperty(isAsync);
      run.mockImplementation(() => (isAsync ? Promise.resolve(originalValue) : originalValue));

      // Act
      const property = new IgnoreEqualValuesProperty(decoratedProperty, true);
      let initialRunOutput: ReturnType<typeof property.run>;
      let secondRunOutput: ReturnType<typeof property.run>;
      if (dontRunHook) {
        await property.runBeforeEach!();
        initialRunOutput = await property.run(null, true);
        await property.runAfterEach!();
        await property.runBeforeEach!();
        secondRunOutput = await property.run(null, true);
        await property.runAfterEach!();
      } else {
        initialRunOutput = await property.run(null, false);
        secondRunOutput = await property.run(null, false);
      }

      // Assert
      if (initialRunOutput === null) {
        // success
        expect(secondRunOutput).not.toBe(initialRunOutput);
        expect(PreconditionFailure.isFailure(secondRunOutput)).toBe(true);
      } else {
        // failure or skip
        expect(secondRunOutput).toBe(initialRunOutput);
      }
    }
  );

  it.each`
    skipRuns
    ${false}
    ${true}
  `('should run decorated property when property is run on another value', ({ skipRuns }) => {
    // Arrange
    const { instance: decoratedProperty, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const property = new IgnoreEqualValuesProperty(decoratedProperty, skipRuns);
    if (dontRunHook) {
      property.runBeforeEach!();
      property.run(1, true);
      property.runAfterEach!();
      property.runBeforeEach!();
      property.run(2, true);
      property.runAfterEach!();
    } else {
      property.run(1, false);
      property.run(2, false);
    }

    // Assert
    expect(run).toHaveBeenCalledTimes(2);
    expect(runBeforeEach).toHaveBeenCalledTimes(2);
    expect(runAfterEach).toHaveBeenCalledTimes(2);
  });
});
