import { describe, expect, it, vi } from 'vitest';
import { ignoreEqualValues, skipEqualValues } from './EqualValuesPlugins.js';
import type { Property } from '../property/types/Property.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { Plugin, PluginStore } from './Plugin.js';
import { asyncToStringMethod } from '../../utils/stringify.js';
import { asyncProperty } from '../property/AsyncProperty.js';
import { constant } from '../../arbitrary/constant.js';
import { check } from '../runner/Runner.js';

describe('EqualValuesPlugins', () => {
  describe.each([
    { pluginName: 'ignoreEqualValues', factory: ignoreEqualValues },
    { pluginName: 'skipEqualValues', factory: skipEqualValues },
  ])('$pluginName', ({ factory }) => {
    it('should detect a failure on a distinct promise-valued example', async () => {
      const property = asyncProperty(constant(Promise.resolve(1)), async (value) => (await value) !== 2);

      const result = await check(property, {
        examples: [[Promise.resolve(1)], [Promise.resolve(2)]],
        numRuns: 2,
        endOnFailure: true,
        plugins: [factory()],
      });

      expect(result.failed).toBe(true);
      expect(result.numRuns).toBe(2);
    });

    it.each([
      { name: 'fulfilled promises', valueFor: (n: number) => [Promise.resolve(n)] },
      {
        name: 'rejected promises',
        valueFor: (n: number) => {
          const value = Promise.reject(n);
          void value.catch(() => undefined);
          return [value];
        },
      },
      { name: 'async serializers', valueFor: (n: number) => ({ [asyncToStringMethod]: async () => `Value(${n})` }) },
    ])('should distinguish $name and cache duplicate values', async ({ valueFor }) => {
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(null);
      const finalRun = equalValuesPluginRun(factory, nestedRun);
      const first = valueFor(1);
      expect(await finalRun(first)).toBe(null);
      const duplicateOutput = await finalRun(valueFor(1));
      const different = valueFor(2);
      expect(await finalRun(different)).toBe(null);

      expect(nestedRun).toHaveBeenCalledTimes(2);
      expect(nestedRun).toHaveBeenNthCalledWith(1, first);
      expect(nestedRun).toHaveBeenNthCalledWith(2, different);
      if (factory === skipEqualValues) {
        expect(PreconditionFailure.isFailure(duplicateOutput)).toBe(true);
      } else {
        expect(duplicateOutput).toBe(null);
      }
    });

    it('should replay a cached failure for duplicate asynchronous values', async () => {
      const failure = { error: new Error('failure') };
      const nestedRun = vi.fn<Property<unknown>['run']>().mockResolvedValue(failure);
      const finalRun = equalValuesPluginRun(factory, nestedRun);

      expect(await finalRun([Promise.resolve(1)])).toBe(failure);
      expect(await finalRun([Promise.resolve(1)])).toBe(failure);
      expect(nestedRun).toHaveBeenCalledTimes(1);
    });

    it('should not call run twice when run on the same value', () => {
      // Arrange
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(null);

      // Act
      const finalRun = equalValuesPluginRun(factory, nestedRun);
      finalRun(1);
      finalRun(1);

      // Assert
      expect(nestedRun).toHaveBeenCalledTimes(1);
    });

    it('should call run again when run on another value', () => {
      // Arrange
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(null);

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
      const nestedRunA = vi.fn<Property<unknown>['run']>().mockReturnValue(null);
      const nestedRunB = vi.fn<Property<unknown>['run']>().mockReturnValue(null);

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
        const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(originalValue);

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
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(originalValue);

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
        .fn<Property<unknown>['run']>()
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
        .fn<Property<unknown>['run']>()
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

function equalValuesPluginRun(factory: () => Plugin<unknown>, nestedRun: Property<unknown>['run']) {
  const store: PluginStore = new Map<symbol, any>();
  const instance = factory()(0, store);
  return instance.decorateRun!(nestedRun);
}
