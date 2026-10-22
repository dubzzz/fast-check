import { describe, expect, it, vi } from 'vitest';
import { ignoreEqualValues, skipEqualValues } from './EqualValuesPlugins.js';
import type { Property } from '../property/types/Property.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { Plugin, PluginStore } from './Plugin.js';
import { stringify } from '../../utils/stringify.js';

describe('EqualValuesPlugins', () => {
  describe.each([
    { pluginName: 'ignoreEqualValues', factory: ignoreEqualValues },
    { pluginName: 'skipEqualValues', factory: skipEqualValues },
  ])('$pluginName', ({ factory }) => {
    it('should not call run twice when run on the same value', () => {
      // Arrange
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(null);
      const firstContext = { signal: new AbortController().signal };
      const secondContext = { signal: new AbortController().signal };

      // Act
      const finalRun = equalValuesPluginRun(factory, nestedRun);
      finalRun(1, firstContext);
      finalRun(1, secondContext);

      // Assert
      expect(nestedRun).toHaveBeenCalledTimes(1);
    });

    it('should call run again when run on another value', () => {
      // Arrange
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(null);
      const firstContext = { signal: new AbortController().signal };
      const secondContext = { signal: new AbortController().signal };

      // Act
      const finalRun = equalValuesPluginRun(factory, nestedRun);
      finalRun(1, firstContext);
      finalRun(2, secondContext);

      // Assert
      expect(nestedRun).toHaveBeenCalledTimes(2);
      expect(nestedRun).toHaveBeenNthCalledWith(1, 1, firstContext);
      expect(nestedRun).toHaveBeenNthCalledWith(2, 2, secondContext);
    });

    it('should not share covered cases across instances of the plugin', () => {
      // Arrange
      let pluginIndex = 0;
      const store: PluginStore = new Map<symbol, any>();
      const nestedRunA = vi.fn<Property<unknown>['run']>().mockReturnValue(null);
      const nestedRunB = vi.fn<Property<unknown>['run']>().mockReturnValue(null);
      const firstContext = { signal: new AbortController().signal };

      // Act
      const instanceA = factory()(pluginIndex++, store);
      const instanceB = factory()(pluginIndex++, store);
      instanceA.decorateRun!(nestedRunA)(1, firstContext);
      instanceB.decorateRun!(nestedRunB)(1, firstContext);

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
        const out = finalRun(1, {});

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
      finalRun(1, {});
      const out = finalRun(1, {});

      // Assert
      expect(out).not.toBeInstanceOf(Promise); // sync run, sync output even on covered cases
    });

    describe('complex values', () => {
      it.each([
        {
          what: 'unconsumed iterators yielding equal values',
          valueRun1: prettyIterator([1, 2]),
          valueRun2: prettyIterator([1, 2]),
          action: (_value: unknown) => null,
          expectedCallCount: 1,
        },
        {
          what: 'unconsumed iterators yielding different values',
          valueRun1: prettyIterator([1, 2]),
          valueRun2: prettyIterator([4]),
          action: (_value: unknown) => null,
          expectedCallCount: 1,
        },
        {
          what: 'iterators yielding equal values with a predicate that fully consumes them',
          valueRun1: prettyIterator([1, 2]),
          valueRun2: prettyIterator([1, 2]),
          action: (value: unknown) => {
            // oxlint-disable-next-line no-unused-vars
            for (const _item of value as IteratorObject<any>) {
              // just pulling from the value, until it gets exhausted
            }
            return null;
          },
          expectedCallCount: 2,
        },
        {
          what: 'iterators yielding different values with a predicate that fully consumes them',
          valueRun1: prettyIterator([1, 2]),
          valueRun2: prettyIterator([4]),
          action: (value: unknown) => {
            // oxlint-disable-next-line no-unused-vars
            for (const _item of value as IteratorObject<any>) {
              // just pulling from the value, until it gets exhausted
            }
            return null;
          },
          expectedCallCount: 2,
        },
        {
          // closer to what we have for `fc.func` with a toString capturing the hash and its seeds and so known before pulling
          what: 'unconsumed iterators exposing equal values in toString',
          valueRun1: prettyIterator([1, 2], true),
          valueRun2: prettyIterator([1, 2], true),
          action: (_value: unknown) => null,
          expectedCallCount: 1,
        },
        {
          // closer to what we have for `fc.func` with a toString capturing the hash and its seeds and so known before pulling
          what: 'unconsumed iterators exposing different values in toString',
          valueRun1: prettyIterator([1, 2], true),
          valueRun2: prettyIterator([4], true),
          action: (_value: unknown) => null,
          expectedCallCount: 2,
        },
        {
          what: 'promises resolving to equal values with a synchronous predicate',
          valueRun1: Promise.resolve(1),
          valueRun2: Promise.resolve(1),
          action: (_value: unknown) => null,
          expectedCallCount: 1,
        },
        {
          what: 'promises resolving to different values with a synchronous predicate',
          valueRun1: Promise.resolve(1),
          valueRun2: Promise.resolve(2),
          action: (_value: unknown) => null,
          expectedCallCount: 1,
        },
        {
          what: 'promises resolving to equal values with an asynchronous predicate',
          valueRun1: Promise.resolve(1),
          valueRun2: Promise.resolve(1),
          action: async (_value: unknown) => null,
          expectedCallCount: 1,
        },
        {
          what: 'promises resolving to different values with an asynchronous predicate',
          valueRun1: Promise.resolve(1),
          valueRun2: Promise.resolve(2),
          action: async (_value: unknown) => null,
          expectedCallCount: 2,
        },
      ])(
        'should call run $expectedCallCount time(s) for $what',
        async ({ valueRun1, valueRun2, action, expectedCallCount }) => {
          // Arrange
          const nestedRun = vi.fn<Property<unknown>['run']>(action);
          const firstContext = { signal: new AbortController().signal };
          const secondContext = { signal: new AbortController().signal };

          // Act
          const finalRun = equalValuesPluginRun(factory, nestedRun);
          await finalRun(valueRun1, firstContext);
          await finalRun(valueRun2, secondContext);

          // Assert
          expect(nestedRun).toHaveBeenCalledTimes(expectedCallCount);
        },
      );
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
      const initialRunOutput = finalRun(null, {});
      const secondRunOutput = finalRun(null, {});

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
      const initialRunOutput = await finalRun(null, {});
      const secondRunOutput = await finalRun(null, {});

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

function prettyIterator<T>(values: T[], knownBefore?: boolean): IteratorObject<T, undefined> {
  // Mimic how an iterator from fast-check would behave
  const extractedValues: T[] = [];
  function* g(): IteratorObject<T, undefined> {
    for (const v of values) {
      extractedValues.push(v);
      yield v;
    }
  }
  return Object.defineProperties(g(), {
    toString: {
      value: () =>
        knownBefore
          ? `Iterator.from(${values.map(stringify).join(',')})`
          : `Iterator.from(${extractedValues.map(stringify).join(',')}${extractedValues.length !== values.length ? '...' : ''})`,
    },
  });
}
