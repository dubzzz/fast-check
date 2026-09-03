import { afterEach, describe, expect, it } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

// Global plugins cannot be uninstalled: we install a single delegating one for the whole file
// and let each test define what it does.
let globalPlugin: fc.Plugin<unknown> = () => ({});
fc.installGlobalPlugin((pluginIndex, pluginStore) => globalPlugin(pluginIndex, pluginStore));

describe(`GlobalPlugins (seed: ${seed})`, () => {
  afterEach(() => {
    globalPlugin = () => ({});
  });

  it('should run global plugins before local ones: instantiated first, outermost wrapper, first onAllRunsComplete and last afterAll', () => {
    // Arrange
    const probes: string[] = [];
    const instantiations: { pluginName: string; pluginIndex: number; pluginStore: fc.PluginStore }[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<unknown> => {
      return (pluginIndex, pluginStore) => {
        instantiations.push({ pluginName, pluginIndex, pluginStore });
        return {
          decorateRun: (nestedRun) => (value) => {
            probes.push(`${pluginName}::run started`);
            const out = nestedRun(value);
            probes.push(`${pluginName}::run done`);
            return out;
          },
          onAllRunsComplete: () => {
            probes.push(`${pluginName}::onAllRunsComplete`);
          },
          afterAll: () => {
            probes.push(`${pluginName}::afterAll`);
          },
        };
      };
    };
    globalPlugin = buildPlugin('global');

    // Act
    fc.assert(
      fc.property(fc.integer(), (_x) => {
        probes.push('predicate called');
        return true;
      }),
      { plugins: [buildPlugin('a'), buildPlugin('b')], numRuns: 2 },
    );

    // Assert
    expect(instantiations.map(({ pluginName, pluginIndex }) => `${pluginName}@${pluginIndex}`)).toEqual([
      'global@0',
      'a@1',
      'b@2',
    ]);
    expect(new Set(instantiations.map(({ pluginStore }) => pluginStore)).size).toBe(1);
    expect(probes).toEqual([
      'global::run started',
      'a::run started',
      'b::run started',
      'predicate called',
      'b::run done',
      'a::run done',
      'global::run done',
      'global::run started',
      'a::run started',
      'b::run started',
      'predicate called',
      'b::run done',
      'a::run done',
      'global::run done',
      'global::onAllRunsComplete',
      'a::onAllRunsComplete',
      'b::onAllRunsComplete',
      'b::afterAll',
      'a::afterAll',
      'global::afterAll',
    ]);
  });
});
