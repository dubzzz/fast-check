import { describe, expect, it, vi } from 'vitest';
import { unbiased } from '../../../../src/check/plugin/UnbiasedPlugin.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { Value } from '../../../../src/check/arbitrary/definition/Value.js';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers.js';

describe('UnbiasedPlugin', () => {
  it('should not pass runId towards the decorated generate', () => {
    // Arrange
    const expectedOut = new Value(Symbol('value'), Symbol('context'));
    const nestedGenerate = vi.fn<IRawProperty<unknown, boolean>['generate']>().mockReturnValueOnce(expectedOut);
    const { instance: mrng } = fakeRandom();

    // Act
    const instance = unbiased()(0, {});
    const finalGenerate = instance.decorateGenerate!(nestedGenerate);
    const out = finalGenerate(mrng, 123);

    // Assert
    expect(out).toBe(expectedOut);
    expect(nestedGenerate).toHaveBeenCalledTimes(1);
    expect(nestedGenerate).toHaveBeenCalledWith(mrng, undefined);
  });

  it('should define one decorateGenerate per instance without merging with other instances', () => {
    // Arrange
    let pluginIndex = 0;
    const sharedContext = {};

    // Act
    const instanceA = unbiased()(pluginIndex++, sharedContext);
    const instanceB = unbiased()(pluginIndex++, sharedContext);

    // Assert
    expect(instanceA.decorateGenerate).not.toBe(undefined);
    expect(instanceB.decorateGenerate).not.toBe(undefined);
    expect(instanceB.decorateGenerate).not.toBe(instanceA.decorateGenerate);
  });
});
