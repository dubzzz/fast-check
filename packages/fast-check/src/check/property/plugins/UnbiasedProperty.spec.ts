import { describe, it, expect } from 'vitest';
import { UnbiasedProperty } from './UnbiasedProperty.js';
import { fakeRandom } from '../../../../test/unit/arbitrary/__test-helpers__/RandomHelpers.js';
import { fakeProperty } from '../../../../test/unit/check/property/__test-helpers__/PropertyHelpers.js';

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
