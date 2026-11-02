import { afterEach, describe, expect, it } from 'vitest';
import { Value } from '../arbitrary/definition/Value.js';
import type { Plugin } from '../plugin/Plugin.js';
import type { Property } from '../property/types/Property.js';
import { assert } from './Runner.js';
import { configureGlobal, resetConfigureGlobal } from './configuration/GlobalParameters.js';
import { asyncToStringMethod } from '../../utils/stringify.js';
import type { RunDetails } from './reporter/RunDetails.js';

describe('Default reporter', () => {
  afterEach(() => {
    resetConfigureGlobal();
  });

  it.each([undefined, false])('should report assert failures when noDefaultPlugins is %s', async (noDefaultPlugins) => {
    const error = new Error('Predicate failure');

    await expect(assert(propertyWithResult(error), { noDefaultPlugins })).rejects.toMatchObject({
      message: expect.stringContaining('Property failed after 1 tests'),
      cause: error,
    });
  });

  it('should resolve assert to undefined when the property succeeds', async () => {
    await expect(assert(propertyWithResult())).resolves.toBeUndefined();
  });

  it('should let assert skip default reporting when noDefaultPlugins is true', async () => {
    await expect(
      assert(propertyWithResult(new Error('Predicate failure')), { noDefaultPlugins: true }),
    ).resolves.toBeUndefined();
  });

  it('should apply global noDefaultPlugins before deciding whether to report', async () => {
    configureGlobal({ noDefaultPlugins: true });

    await expect(assert(propertyWithResult(new Error('Predicate failure')))).resolves.toBeUndefined();
  });

  it('should enable reporting when local false overrides global true', async () => {
    configureGlobal({ noDefaultPlugins: true });

    await expect(
      assert(propertyWithResult(new Error('Predicate failure')), { noDefaultPlugins: false }),
    ).rejects.toThrow('Property failed');
  });

  it('should disable reporting when local true overrides global false', async () => {
    configureGlobal({ noDefaultPlugins: false });

    await expect(
      assert(propertyWithResult(new Error('Predicate failure')), { noDefaultPlugins: true }),
    ).resolves.toBeUndefined();
  });

  it.each([false, true])('should run completion and cleanup hooks (async property: %s)', async (asynchronous) => {
    const events: string[] = [];
    const error = new Error('Predicate failure');
    const buildPlugin = (name: string): Plugin<[number]> => () => ({
      onAllRunsComplete: (runDetails) => {
        expect(runDetails.failed).toBe(true);
        events.push(`${name} complete`);
      },
      afterAll: () => {
        events.push(`${name} cleanup`);
      },
    });

    await expect(
      assert(propertyWithResult(error, asynchronous), { plugins: [buildPlugin('a'), buildPlugin('b')] }),
    ).rejects.toMatchObject({ cause: error });

    expect(events).toEqual(['a complete', 'b complete', 'b cleanup', 'a cleanup']);
  });

  it.each([false, true])('should prefer the first user completion error (async hook: %s)', async (asynchronous) => {
    const completionError = new Error('Completion failure');
    const events: string[] = [];
    const plugins: Plugin<[number]>[] = [
      () => ({
        onAllRunsComplete: () => {
          events.push('first complete');
          if (asynchronous) {
            return Promise.reject(completionError);
          }
          throw completionError;
        },
        afterAll: () => {
          events.push('first cleanup');
        },
      }),
      () => ({
        onAllRunsComplete: () => {
          events.push('second complete');
          throw new Error('Later completion failure');
        },
        afterAll: () => {
          events.push('second cleanup');
        },
      }),
    ];

    await expect(assert(propertyWithResult(new Error('Predicate failure')), { plugins })).rejects.toBe(completionError);

    expect(events).toEqual(['first complete', 'second complete', 'second cleanup', 'first cleanup']);
  });

  it.each([false, true])('should prefer property errors over cleanup errors (async: %s)', async (asynchronous) => {
    const error = new Error('Predicate failure');
    let cleanedUp = false;
    const cleanup = () => {
      cleanedUp = true;
      throw new Error('Cleanup failure');
    };
    const plugin: Plugin<[number]> = () => ({
      afterAll: () => (asynchronous ? Promise.resolve().then(cleanup) : cleanup()),
    });

    await expect(assert(propertyWithResult(error), { plugins: [plugin] })).rejects.toMatchObject({ cause: error });

    expect(cleanedUp).toBe(true);
  });

  it('should keep custom plugins active when default plugins are disabled', async () => {
    const completionError = new Error('Completion failure');
    const plugin: Plugin<[number]> = () => ({
      onAllRunsComplete: () => {
        throw completionError;
      },
    });

    await expect(
      assert(propertyWithResult(new Error('Predicate failure')), { noDefaultPlugins: true, plugins: [plugin] }),
    ).rejects.toBe(completionError);
  });

  it('should not mutate or append implicit defaults to the supplied plugin list', async () => {
    const results: RunDetails<[number]>[] = [];
    const plugin: Plugin<[number]> = () => ({
      onAllRunsComplete: (runDetails) => {
        results.push(runDetails);
      },
    });
    const plugins = [plugin];
    Object.freeze(plugins);

    await assert(propertyWithResult(), { plugins });
    await assert(propertyWithResult(), results[0].runConfiguration);

    expect(plugins).toEqual([plugin]);
    expect(results).toHaveLength(2);
    expect(results[0].runConfiguration.plugins).toEqual([plugin]);
    expect(results[1].runConfiguration.plugins).toEqual([plugin]);
  });

  it('should await asynchronous counterexample formatting before cleanup', async () => {
    const events: string[] = [];
    const counterexample = {
      [asyncToStringMethod]: async () => {
        await Promise.resolve();
        events.push('formatted');
        return 'asynchronously formatted counterexample';
      },
    };
    const property: Property<[typeof counterexample]> = {
      generate: () => new Value([counterexample], undefined),
      shrink: () => Iterator.from([]),
      run: () => ({ error: new Error('Predicate failure') }),
    };
    const plugin: Plugin<[typeof counterexample]> = () => ({
      afterAll: () => {
        events.push('cleanup');
      },
    });

    await expect(assert(property, { plugins: [plugin] })).rejects.toThrow('asynchronously formatted counterexample');

    expect(events).toEqual(['formatted', 'cleanup']);
  });
});

function propertyWithResult(error?: Error, asynchronous = false): Property<[number]> {
  const result = error === undefined ? null : { error };
  return {
    generate: () => new Value<[number]>([42], undefined),
    shrink: () => Iterator.from([]),
    run: () => (asynchronous ? Promise.resolve(result) : result),
  };
}
