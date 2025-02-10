import { describe, it, expect } from 'vitest';
import { IgnoreEqualValuesProperty } from '../../../../src/check/property/IgnoreEqualValuesProperty';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { fakeProperty } from './__test-helpers__/PropertyHelpers';

describe('IgnoreEqualValuesProperty', () => {
  it.each`
    skipRuns
    ${false}
    ${true}
  `(
    'should not call run on the decorated property when property is run on the same value for skipRuns=$skipRuns',
    ({ skipRuns }) => {
      // Arrange
      const { instance: decoratedProperty, run, runBeforeEach, runAfterEach } = fakeProperty();

      // Act
      const property = new IgnoreEqualValuesProperty(decoratedProperty, skipRuns);
      property.runBeforeEach();
      property.run(1);
      property.runAfterEach();
      property.runBeforeEach();
      property.run(1);
      property.runAfterEach();

      // Assert
      expect(run).toHaveBeenCalledTimes(1);
      // We may not want to run hooks twice but once in such context, but so far we do
      expect(runBeforeEach).toHaveBeenCalledTimes(2);
      expect(runAfterEach).toHaveBeenCalledTimes(2);
    },
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
      property.runBeforeEach();
      const initialRunOutput = property.run(null);
      property.runAfterEach();
      property.runBeforeEach();
      const secondRunOutput = property.run(null);
      property.runAfterEach();

      // Assert
      expect(secondRunOutput).toBe(initialRunOutput);
    },
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
      await property.runBeforeEach();
      const initialRunOutput = await property.run(null);
      await property.runAfterEach();
      await property.runBeforeEach();
      const secondRunOutput = await property.run(null);
      await property.runAfterEach();

      // Assert
      if (initialRunOutput === null) {
        // success
        expect(secondRunOutput).not.toBe(initialRunOutput);
        expect(PreconditionFailure.isFailure(secondRunOutput)).toBe(true);
      } else {
        // failure or skip
        expect(secondRunOutput).toBe(initialRunOutput);
      }
    },
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
    property.runBeforeEach();
    property.run(1);
    property.runAfterEach();
    property.runBeforeEach();
    property.run(2);
    property.runAfterEach();

    // Assert
    expect(run).toHaveBeenCalledTimes(2);
    expect(runBeforeEach).toHaveBeenCalledTimes(2);
    expect(runAfterEach).toHaveBeenCalledTimes(2);
  });
});
