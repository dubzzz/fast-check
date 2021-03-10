import { IRawProperty } from '../../../../src/check/property/IRawProperty';
import { IgnoreEqualValuesProperty } from '../../../../src/check/property/IgnoreEqualValuesProperty';

function buildProperty() {
  const mocks = {
    isAsync: jest.fn(),
    generate: jest.fn(),
    run: jest.fn(),
  };
  return { mocks, property: mocks as IRawProperty<any> };
}

describe('IgnoreEqualValuesProperty', () => {
  it('should not run decorated property when property is run on the same value', async () => {
    const { mocks: propertyMock, property: decoratedProperty } = buildProperty();
    const property = new IgnoreEqualValuesProperty(decoratedProperty);
    property.run(1);
    property.run(1);

    expect(propertyMock.run.mock.calls.length).toBe(1);
  });

  it('should run decorated property when property is run on another value', async () => {
    const { mocks: propertyMock, property: decoratedProperty } = buildProperty();
    const property = new IgnoreEqualValuesProperty(decoratedProperty);
    property.run(1);
    property.run(2);

    expect(propertyMock.run.mock.calls.length).toBe(2);
  });
});
