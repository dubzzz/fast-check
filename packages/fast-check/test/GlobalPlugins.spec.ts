import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fc from '../src/fast-check.js';
import * as DefaultReporterPlugin from '../src/check/plugin/DefaultReporterPlugin.js';
import { readInstalledGlobalPlugins } from '../src/check/runner/configuration/GlobalPlugins.js';

describe('Global plugins', () => {
  afterEach(() => {
    readInstalledGlobalPlugins('pre').length = 0;
    readInstalledGlobalPlugins('post').length = 0;
  });

  it.each([
    { asyncPredicate: false, noDefaultPlugins: false },
    { asyncPredicate: true, noDefaultPlugins: false },
    { asyncPredicate: false, noDefaultPlugins: true },
    { asyncPredicate: true, noDefaultPlugins: true },
  ])(
    'should order pre, local and post plugins (async: $asyncPredicate, noDefaultPlugins: $noDefaultPlugins)',
    async ({ asyncPredicate, noDefaultPlugins }) => {
      // Arrange
      const probes: string[] = [];
      const instances: { name: string; index: number; store: fc.PluginStore }[] = [];
      const buildPlugin = (name: string): fc.UniversalPlugin => {
        return (index, store) => {
          instances.push({ name, index, store });
          return {
            decorateGenerate:
              (nestedGenerate) =>
              (...args) => {
                probes.push(`${name}: generate enter`);
                const out = nestedGenerate(...args);
                probes.push(`${name}: generate exit`);
                return out;
              },
            decorateRun: (nestedRun) =>
              asyncPredicate
                ? async (...args) => {
                    probes.push(`${name}: run enter`);
                    const out = await nestedRun(...args);
                    probes.push(`${name}: run exit`);
                    return out;
                  }
                : (...args) => {
                    probes.push(`${name}: run enter`);
                    const out = nestedRun(...args);
                    probes.push(`${name}: run exit`);
                    return out;
                  },
            onAllRunsComplete: () => {
              probes.push(`${name}: complete`);
            },
            afterAll: () => {
              probes.push(`${name}: afterAll`);
            },
          };
        };
      };
      fc.installGlobalPlugin(buildPlugin('post1'), 'post');
      fc.installGlobalPlugin(buildPlugin('pre1'));
      fc.installGlobalPlugin(buildPlugin('post2'), 'post');
      fc.installGlobalPlugin(buildPlugin('pre2'), 'pre');
      const defaultReporter = vi
        .spyOn(DefaultReporterPlugin, 'defaultReporter')
        .mockReturnValue(buildPlugin('default'));

      // Act
      await fc.assert(
        fc.property(fc.constant(null), () => {
          probes.push('predicate');
          return asyncPredicate ? Promise.resolve(true) : true;
        }),
        { plugins: [buildPlugin('local')], numRuns: 1, noDefaultPlugins },
      );

      // Assert
      expect(defaultReporter).toHaveBeenCalledTimes(noDefaultPlugins ? 0 : 1);
      expect(instances.map(({ name, index }) => ({ name, index }))).toEqual([
        { name: 'pre1', index: 0 },
        { name: 'pre2', index: 1 },
        { name: 'local', index: 2 },
        { name: 'post1', index: 3 },
        { name: 'post2', index: 4 },
        ...(noDefaultPlugins ? [] : [{ name: 'default', index: 5 }]),
      ]);
      expect(new Set(instances.map(({ store }) => store)).size).toBe(1);
      expect(probes).toEqual([
        'pre1: generate enter',
        'pre2: generate enter',
        'local: generate enter',
        'post1: generate enter',
        'post2: generate enter',
        ...(noDefaultPlugins ? [] : ['default: generate enter', 'default: generate exit']),
        'post2: generate exit',
        'post1: generate exit',
        'local: generate exit',
        'pre2: generate exit',
        'pre1: generate exit',
        'pre1: run enter',
        'pre2: run enter',
        'local: run enter',
        'post1: run enter',
        'post2: run enter',
        ...(noDefaultPlugins ? [] : ['default: run enter']),
        'predicate',
        ...(noDefaultPlugins ? [] : ['default: run exit']),
        'post2: run exit',
        'post1: run exit',
        'local: run exit',
        'pre2: run exit',
        'pre1: run exit',
        'pre1: complete',
        'pre2: complete',
        'local: complete',
        'post1: complete',
        'post2: complete',
        ...(noDefaultPlugins ? [] : ['default: complete', 'default: afterAll']),
        'post2: afterAll',
        'post1: afterAll',
        'local: afterAll',
        'pre2: afterAll',
        'pre1: afterAll',
      ]);
    },
  );
});
