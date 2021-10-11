import { IgnoreEqualValuesProperty } from '../../../../src/check/property/IgnoreEqualValuesProperty';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { fakeNextProperty } from './__test-helpers__/PropertyHelpers';

describe('IgnoreEqualValuesProperty', () => {
  it.each`
    skipRuns
    ${false}
    ${true}
  `('should not call run on the decorated property when property is run on the same value', ({ skipRuns }) => {
    // Arrange
    const { instance: decoratedProperty, run } = fakeNextProperty();

    // Act
    const property = new IgnoreEqualValuesProperty(decoratedProperty, skipRuns);
    property.run(1);
    property.run(1);

    // Assert
    expect(run).toHaveBeenCalledTimes(1);
  });

  it.each`
    originalValue                           | isAsync
    ${null /* success */}                   | ${false}
    ${'error' /* failure */}                | ${false}
    ${new PreconditionFailure() /* skip */} | ${false}
    ${null /* success */}                   | ${true}
    ${'error' /* failure */}                | ${true}
    ${new PreconditionFailure() /* skip */} | ${true}
  `(
    'should always return the cached value for skipRuns=false, originalValue=$originalValue, isAsync=$isAsync',
    ({ originalValue, isAsync }) => {
      // Arrange
      // success -> success
      // failure -> failure
      // skip    -> skip
      const { instance: decoratedProperty, run } = fakeNextProperty(isAsync);
      run.mockImplementation(() => (isAsync ? Promise.resolve(originalValue) : originalValue));

      // Act
      const property = new IgnoreEqualValuesProperty(decoratedProperty, false);
      const initialRunOutput = property.run(null);
      const secondRunOutput = property.run(null);

      // Assert
      expect(secondRunOutput).toBe(initialRunOutput);
    }
  );

  it.each`
    originalValue                           | isAsync
    ${null /* success */}                   | ${false}
    ${'error' /* failure */}                | ${false}
    ${new PreconditionFailure() /* skip */} | ${false}
    ${null /* success */}                   | ${true}
    ${'error' /* failure */}                | ${true}
    ${new PreconditionFailure() /* skip */} | ${true}
  `(
    'should return the cached value but skip success for skipRuns=true, originalValue=$originalValue, isAsync=$isAsync',
    async ({ originalValue, isAsync }) => {
      // Arrange
      // success -> skip
      // failure -> failure
      // skip    -> skip
      const { instance: decoratedProperty, run } = fakeNextProperty(isAsync);
      run.mockImplementation(() => (isAsync ? Promise.resolve(originalValue) : originalValue));

      // Act
      const property = new IgnoreEqualValuesProperty(decoratedProperty, true);
      const initialRunOutput = await property.run(null);
      const secondRunOutput = await property.run(null);

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
    const { instance: decoratedProperty, run } = fakeNextProperty();

    // Act
    const property = new IgnoreEqualValuesProperty(decoratedProperty, skipRuns);
    property.run(1);
    property.run(2);

    // Assert
    expect(run).toHaveBeenCalledTimes(2);
  });
});
