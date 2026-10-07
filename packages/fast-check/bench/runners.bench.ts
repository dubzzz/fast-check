import { describe } from 'vitest';
import type { PluginInstance, UniversalPlugin } from '../src/fast-check.js';
import { bench } from './__test-helpers__/Bench.js';
import { fc } from './__test-helpers__/Imports.js';

describe('runner', () => {
  bench('assert on successful synchronous predicate', () => {
    return fc.assert(fc.property(fc.constant(1), (_c) => true));
  });

  for (const { plugin, name } of [
    { plugin: emptyPlugin(), name: 'empty' },
    { plugin: fullPlugin(), name: 'full' },
    { plugin: fullAsyncPlugin(), name: 'full async' },
  ]) {
    bench(`assert on successful synchronous predicate with 1 ${name} plugin`, () => {
      return fc.assert(
        fc.property(fc.constant(1), (_c) => true),
        { plugins: [plugin] },
      );
    });

    bench(`assert on successful synchronous predicate with 5 ${name} plugins`, () => {
      return fc.assert(
        fc.property(fc.constant(1), (_c) => true),
        { plugins: [plugin, plugin, plugin, plugin, plugin] },
      );
    });
  }

  bench('assert on successful asynchronous predicate', () => {
    return fc.assert(fc.property(fc.constant(1), async (_c) => true));
  });
});

// Helpers

function emptyPlugin(): UniversalPlugin {
  return () => ({});
}

function fullPlugin(): UniversalPlugin {
  return (): Required<PluginInstance<any>> => ({
    decorateGenerate: (nestedGenerate) => (mrng, runId) => nestedGenerate(mrng, runId),
    decorateRun: (nestedRun) => (v) => nestedRun(v),
    onAllRunsComplete: () => {},
    afterAll: () => {},
  });
}

function fullAsyncPlugin(): UniversalPlugin {
  return (): Required<PluginInstance<any>> => ({
    decorateGenerate: (nestedGenerate) => (mrng, runId) => nestedGenerate(mrng, runId),
    decorateRun: (nestedRun) => async (v) => nestedRun(v),
    onAllRunsComplete: async () => {},
    afterAll: async () => {},
  });
}
