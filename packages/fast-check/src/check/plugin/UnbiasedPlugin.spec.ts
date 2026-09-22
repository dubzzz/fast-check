import { describe, expect, it, vi } from 'vitest';
import { unbiased } from './UnbiasedPlugin.js';
import type { Property } from '../property/types/Property.js';
import type { PluginStore } from './Plugin.js';
import { Value } from '../arbitrary/definition/Value.js';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers.js';

describe('UnbiasedPlugin', () => {
  it('should not pass runId towards the decorated generate', () => {
    // Arrange
    const expectedOut = new Value(Symbol('value'), Symbol('context'));
    const nestedGenerate = vi.fn<Property<unknown>['generate']>().mockReturnValueOnce(expectedOut);
    const { instance: mrng } = fakeRandom();

    // Act
    const store: PluginStore = new Map<symbol, any>();
    const instance = unbiased()(0, store);
    const finalGenerate = instance.decorateGenerate!(nestedGenerate);
    const out = finalGenerate(mrng, 123);

    // Assert
    expect(out).toBe(expectedOut);
    expect(nestedGenerate).toHaveBeenCalledTimes(1);
    expect(nestedGenerate).toHaveBeenCalledWith(mrng, undefined);
  });
});
