import { IRawProperty } from '../../../../src/check/property/IRawProperty';
import { IgnoreEqualValuesProperty } from '../../../../src/check/property/IgnoreEqualValuesProperty';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';

function buildProperty() {
  const mocks = {
    isAsync: jest.fn(),
    generate: jest.fn(),
    run: jest.fn(),
  };
  return { mocks, property: mocks as IRawProperty<any> };
}

describe('IgnoreEqualValuesProperty', () => {
  it.each`
    skipRuns
    ${false}
    ${true}
  `('should not run decorated property when property is run on the same value', ({ skipRuns }) => {
    const { mocks: propertyMock, property: decoratedProperty } = buildProperty();
    const property = new IgnoreEqualValuesProperty(decoratedProperty, skipRuns);
    property.run(1);
    property.run(1);

    expect(propertyMock.run.mock.calls.length).toBe(1);
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
      // success -> success
      // failure -> failure
      // skip    -> skip
      const property = new IgnoreEqualValuesProperty(
        {
          isAsync: () => isAsync,
          run: () => (isAsync ? Promise.resolve(originalValue) : originalValue),
          generate: () => new Shrinkable(null),
        },
        false
      );

      const initialRunOutput = property.run(null);
      const secondRunOutput = property.run(null);

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
    // success -> skip
    // failure -> failure
    // skip    -> skip
    async ({ originalValue, isAsync }) => {
      const property = new IgnoreEqualValuesProperty(
        {
          isAsync: () => isAsync,
          run: () => (isAsync ? Promise.resolve(originalValue) : originalValue),
          generate: () => new Shrinkable(null),
        },
        true
      );

      const initialRunOutput = await property.run(null);
      const secondRunOutput = await property.run(null);

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
    const { mocks: propertyMock, property: decoratedProperty } = buildProperty();
    const property = new IgnoreEqualValuesProperty(decoratedProperty, skipRuns);
    property.run(1);
    property.run(2);

    expect(propertyMock.run.mock.calls.length).toBe(2);
  });
});
