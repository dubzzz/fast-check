import { describe, expect, it, vi } from 'vitest';
import { ignoreEqualValues, skipEqualValues } from '../../../../src/check/plugin/EqualValuesPlugins.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import type { Plugin, PluginStore } from '../../../../src/check/plugin/Plugin.js';

describe('EqualValuesPlugins', () => {
  describe.each([
    { pluginName: 'ignoreEqualValues', factory: ignoreEqualValues },
    { pluginName: 'skipEqualValues', factory: skipEqualValues },
  ])('$pluginName', ({ factory }) => {
    it('should not call run twice when run on the same value', () => {
      // Arrange
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValue(null);

      // Act
      const finalRun = equalValuesPluginRun(factory, nestedRun);
      finalRun(1);
      finalRun(1);

      // Assert
      expect(nestedRun).toHaveBeenCalledTimes(1);
    });

    it('should call run again when run on another value', () => {
      // Arrange
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValue(null);

      // Act
      const finalRun = equalValuesPluginRun(factory, nestedRun);
      finalRun(1);
      finalRun(2);

      // Assert
      expect(nestedRun).toHaveBeenCalledTimes(2);
      expect(nestedRun).toHaveBeenCalledWith(1);
      expect(nestedRun).toHaveBeenCalledWith(2);
    });

    it('should not share covered cases across instances of the plugin', () => {
      // Arrange
      let pluginIndex = 0;
      const store: PluginStore = new Map<symbol, any>();
      const nestedRunA = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValue(null);
      const nestedRunB = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValue(null);

      // Act
      const instanceA = factory()(pluginIndex++, store);
      const instanceB = factory()(pluginIndex++, store);
      instanceA.decorateRun!(nestedRunA)(1);
      instanceB.decorateRun!(nestedRunB)(1);

      // Assert
      expect(instanceA.decorateRun).not.toBe(instanceB.decorateRun); // no instance merging
      expect(nestedRunA).toHaveBeenCalledTimes(1);
      expect(nestedRunB).toHaveBeenCalledTimes(1); // not treated as an already covered case
    });

    it.each([
      { originalValuePretty: 'null', originalValue: null },
      { originalValuePretty: 'failure', originalValue: { error: new Error('plop') } },
      { originalValuePretty: 'new PreconditionFailure()', originalValue: new PreconditionFailure() },
    ])(
      'should preserve synchronous runs synchronous on first occurence for $originalValuePretty',
      ({ originalValue }) => {
        // Arrange
        const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValue(originalValue);

        // Act
        const finalRun = equalValuesPluginRun(factory, nestedRun);
        const out = finalRun(1);

        // Assert
        expect(out).not.toBeInstanceOf(Promise); // sync run, sync output even on covered cases
      },
    );

    it.each([
      { originalValuePretty: 'null', originalValue: null },
      { originalValuePretty: 'failure', originalValue: { error: new Error('plop') } },
      { originalValuePretty: 'new PreconditionFailure()', originalValue: new PreconditionFailure() },
    ])('should preserve synchronous runs synchronous on duplicates for $originalValuePretty', ({ originalValue }) => {
      // Arrange
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValue(originalValue);

      // Act
      const finalRun = equalValuesPluginRun(factory, nestedRun);
      finalRun(1);
      const out = finalRun(1);

      // Assert
      expect(out).not.toBeInstanceOf(Promise); // sync run, sync output even on covered cases
    });
  });

  it.each([
    { originalValuePretty: 'null', originalValue: null, isAsync: false },
    { originalValuePretty: 'failure', originalValue: { error: new Error('plop') }, isAsync: false },
    { originalValuePretty: 'new PreconditionFailure()', originalValue: new PreconditionFailure(), isAsync: false },
    { originalValuePretty: 'null', originalValue: null, isAsync: true },
    { originalValuePretty: 'failure', originalValue: { error: new Error('plop') }, isAsync: true },
    { originalValuePretty: 'new PreconditionFailure()', originalValue: new PreconditionFailure(), isAsync: true },
  ])(
    'should always return the cached value for ignoreEqualValues, originalValue=$originalValuePretty, isAsync=$isAsync',
    ({ originalValue, isAsync }) => {
      // Arrange
      // success -> success
      // failure -> failure
      // skip    -> skip
      const nestedRun = vi
        .fn<IRawProperty<unknown, boolean>['run']>()
        .mockImplementation(() => (isAsync ? Promise.resolve(originalValue) : originalValue));

      // Act
      const finalRun = equalValuesPluginRun(ignoreEqualValues, nestedRun);
      const initialRunOutput = finalRun(null);
      const secondRunOutput = finalRun(null);

      // Assert
      expect(secondRunOutput).toBe(initialRunOutput);
    },
  );

  it.each([
    { originalValuePretty: 'null', originalValue: null, isAsync: false },
    { originalValuePretty: 'failure', originalValue: { error: new Error('plop') }, isAsync: false },
    { originalValuePretty: 'new PreconditionFailure()', originalValue: new PreconditionFailure(), isAsync: false },
    { originalValuePretty: 'null', originalValue: null, isAsync: true },
    { originalValuePretty: 'failure', originalValue: { error: new Error('plop') }, isAsync: true },
    { originalValuePretty: 'new PreconditionFailure()', originalValue: new PreconditionFailure(), isAsync: true },
  ])(
    'should return the cached value but skip success for skipEqualValues, originalValue=$originalValuePretty, isAsync=$isAsync',
    async ({ originalValue, isAsync }) => {
      // Arrange
      // success -> skip
      // failure -> failure
      // skip    -> skip
      const nestedRun = vi
        .fn<IRawProperty<unknown, boolean>['run']>()
        .mockImplementation(() => (isAsync ? Promise.resolve(originalValue) : originalValue));

      // Act
      const finalRun = equalValuesPluginRun(skipEqualValues, nestedRun);
      const initialRunOutput = await finalRun(null);
      const secondRunOutput = await finalRun(null);

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
});

// Helpers

function equalValuesPluginRun(factory: () => Plugin<unknown>, nestedRun: IRawProperty<unknown, boolean>['run']) {
  const store: PluginStore = new Map<symbol, any>();
  const instance = factory()(0, store);
  return instance.decorateRun!(nestedRun);
}
