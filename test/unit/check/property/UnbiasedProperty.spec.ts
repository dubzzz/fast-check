import { UnbiasedProperty } from '../../../../src/check/property/UnbiasedProperty';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers';
import { fakeProperty } from './__test-helpers__/PropertyHelpers';

describe('UnbiasedProperty', () => {
  it('should not pass runId towards the decorated property on generate', () => {
    // Arrange
    const { instance: decoratedProperty, generate } = fakeProperty();
    const { instance: mrng } = fakeRandom();

    // Act
    const unbiasedAsyncProp = new UnbiasedProperty(decoratedProperty);
    unbiasedAsyncProp.generate(mrng, 123);

    // Assert
    expect(generate).toHaveBeenCalledWith(mrng, undefined);
  });
});
