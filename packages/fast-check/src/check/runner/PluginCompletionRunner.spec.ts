import { describe, expect, it, vi } from 'vitest';
import type { PluginInstance } from '../plugin/Plugin.js';
import { pluginCompletionRunner } from './PluginCompletionRunner.js';
import type { RunDetails } from './reporter/RunDetails.js';

describe('pluginCompletionRunner', () => {
  it.each([
    { plugins: [] },
    { plugins: [{}] },
    { plugins: [{ onAllRunsComplete: undefined, afterAll: undefined }] },
  ])(
    'should return the original promise when no completion hooks are present (%j)',
    ({ plugins }) => {
      // Arrange
      const detailsPromise = Promise.resolve(buildRunDetails());

      // Act
      const out = pluginCompletionRunner(plugins, detailsPromise);

      // Assert
      expect(out).toBe(detailsPromise);
    },
  );

  it('should wait for the run details and preserve the details, hook arguments and receivers', async () => {
    // Arrange
    const details = buildRunDetails();
    let completeRun = () => {};
    const detailsPromise = new Promise<RunDetails<number>>((resolve) => {
      completeRun = () => resolve(details);
    });
    const onAllRunsComplete = vi.fn((_details: RunDetails<number>) => {});
    const afterAll = vi.fn(() => {});
    const plugin = { onAllRunsComplete, afterAll };

    // Act
    const out = pluginCompletionRunner([plugin], detailsPromise);

    // Assert
    await Promise.resolve();
    expect(onAllRunsComplete).not.toHaveBeenCalled();
    expect(afterAll).not.toHaveBeenCalled();
    completeRun();
    expect(await out).toBe(details);
    expect(onAllRunsComplete.mock.calls).toEqual([[details]]);
    expect(onAllRunsComplete.mock.calls[0][0]).toBe(details);
    expect(onAllRunsComplete.mock.contexts[0]).toBe(plugin);
    expect(afterAll.mock.calls).toEqual([[]]);
    expect(afterAll.mock.contexts[0]).toBe(plugin);
  });

  it('should await completion hooks in declaration order then cleanup hooks in reverse order', async () => {
    // Arrange
    const details = buildRunDetails();
    const probes: string[] = [];
    const buildHook = (name: string, isAsync: boolean) => () => {
      probes.push(`${name} started`);
      if (isAsync) {
        return Promise.resolve().then(() => {
          probes.push(`${name} done`);
        });
      }
      probes.push(`${name} done`);
    };
    const plugins: PluginInstance<number>[] = [
      { onAllRunsComplete: buildHook('a complete', false), afterAll: buildHook('a cleanup', false) },
      {},
      { onAllRunsComplete: buildHook('b complete', true) },
      { afterAll: buildHook('c cleanup', false) },
      { onAllRunsComplete: buildHook('d complete', true), afterAll: buildHook('d cleanup', true) },
    ];

    // Act
    const out = await pluginCompletionRunner(plugins, Promise.resolve(details));
    probes.push('runner done');

    // Assert
    expect(out).toBe(details);
    expect(probes).toEqual([
      'a complete started',
      'a complete done',
      'b complete started',
      'b complete done',
      'd complete started',
      'd complete done',
      'd cleanup started',
      'd cleanup done',
      'c cleanup started',
      'c cleanup done',
      'a cleanup started',
      'a cleanup done',
      'runner done',
    ]);
  });

  it('should run consecutive synchronous completion and cleanup hooks in the same microtask', async () => {
    // Arrange
    const probes: string[] = [];
    const plugins: PluginInstance<number>[] = [
      {
        onAllRunsComplete: () => {
          probes.push('a complete');
          void Promise.resolve().then(() => probes.push('next microtask'));
        },
        afterAll: () => {
          probes.push('a cleanup');
        },
      },
      {
        onAllRunsComplete: () => {
          probes.push('b complete');
        },
        afterAll: () => {
          probes.push('b cleanup');
        },
      },
    ];

    // Act
    await pluginCompletionRunner(plugins, Promise.resolve(buildRunDetails()));

    // Assert
    expect(probes).toEqual(['a complete', 'b complete', 'b cleanup', 'a cleanup', 'next microtask']);
  });

  describe.each(['onAllRunsComplete', 'afterAll'] as const)('%s failures', (firstFailureHook) => {
    it.each([
      { firstError: new Error('first failure'), isAsync: false },
      { firstError: undefined, isAsync: false },
      { firstError: new Error('first failure'), isAsync: true },
      { firstError: undefined, isAsync: true },
    ])('should run all hooks and preserve the first error (%j)', async ({ firstError, isAsync }) => {
      // Arrange
      const probes: string[] = [];
      let nextError: unknown = firstError;
      const fail = () => {
        const error = nextError;
        nextError = new Error('later failure');
        if (isAsync) {
          return Promise.reject(error);
        }
        throw error;
      };
      const plugins: PluginInstance<number>[] = ['a', 'b', 'c'].map((name) => ({
        onAllRunsComplete: () => {
          probes.push(`${name} complete`);
          if (firstFailureHook === 'onAllRunsComplete') {
            return fail();
          }
        },
        afterAll: () => {
          probes.push(`${name} cleanup`);
          return fail();
        },
      }));

      // Act
      const out = pluginCompletionRunner(plugins, Promise.resolve(buildRunDetails()));

      // Assert
      await expect(out).rejects.toBe(firstError);
      expect(probes).toEqual(['a complete', 'b complete', 'c complete', 'c cleanup', 'b cleanup', 'a cleanup']);
    });
  });

  it('should forward rejection of the run details without calling completion or cleanup hooks', async () => {
    // Arrange
    const error = new Error('run failed');
    const onAllRunsComplete = vi.fn();
    const afterAll = vi.fn();

    // Act
    const out = pluginCompletionRunner([{ onAllRunsComplete, afterAll }], Promise.reject(error));

    // Assert
    await expect(out).rejects.toBe(error);
    expect(onAllRunsComplete).not.toHaveBeenCalled();
    expect(afterAll).not.toHaveBeenCalled();
  });
});

// Helpers

function buildRunDetails(): RunDetails<number> {
  return {
    failed: false,
    interrupted: false,
    numRuns: 1,
    numSkips: 0,
    numShrinks: 0,
    seed: 42,
    counterexample: null,
    errorInstance: null,
    counterexamplePath: null,
    failures: [],
    executionSummary: [],
    verbose: 0,
    runConfiguration: {},
  };
}
