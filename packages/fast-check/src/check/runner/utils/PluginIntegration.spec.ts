import { describe, expect, it, vi } from 'vitest';
import * as DefaultReporterPlugin from '../../plugin/DefaultReporterPlugin.js';
import type { PluginInstance, PluginStore, UniversalPlugin } from '../../plugin/Plugin.js';
import * as GlobalPlugins from '../configuration/GlobalPlugins.js';
import { instantiatePlugins } from './PluginIntegration.js';

describe('instantiatePlugins', () => {
  it.each([
    { what: 'pre, local, post and default', when: 'by default', noDefaultPlugins: false, noGlobalPlugins: false },
    {
      what: 'pre, local and post',
      when: 'without defaults',
      noDefaultPlugins: true,
      noGlobalPlugins: false,
    },
    {
      what: 'local and defaults',
      when: 'without globals',
      noDefaultPlugins: false,
      noGlobalPlugins: true,
    },
    {
      what: 'only local',
      when: 'without defaults or globals',
      noDefaultPlugins: true,
      noGlobalPlugins: true,
    },
  ])('should instantiate $what plugins in order $when', ({ noDefaultPlugins, noGlobalPlugins }) => {
    // Arrange
    const { localPlugins, instances, calls, defaultReporter } = setupPlugins();
    const expectedNames: (keyof typeof instances)[] = [
      ...(noGlobalPlugins ? [] : ['pre1', 'pre2']),
      'local1',
      'local2',
      ...(noGlobalPlugins ? [] : ['post1', 'post2']),
      ...(noDefaultPlugins ? [] : ['default']),
    ];

    // Act
    const out = instantiatePlugins(localPlugins, !noDefaultPlugins, !noGlobalPlugins);

    // Assert
    expect(out).toEqual(expectedNames.map((name) => instances[name]));
    expect(calls.map(({ name }) => name)).toEqual(expectedNames);
    expect(calls.map(({ index }) => index)).toEqual(expectedNames.map((_, index) => index));
    expect(new Set(calls.map(({ store }) => store)).size).toBe(1);
    if (!noDefaultPlugins) {
      expect(defaultReporter).toHaveBeenCalledExactlyOnceWith();
    }
  });
});

// Helpers

function setupPlugins() {
  const calls: { name: string; index: number; store: PluginStore }[] = [];
  const instances: Record<string, PluginInstance<unknown>> = {};
  const buildPlugin = (name: string): UniversalPlugin => {
    const instance = { afterAll: vi.fn() }; // unique method per instance to ease comparison (otherwise toEqual does not check anything)
    instances[name] = instance;
    return (index, store) => {
      calls.push({ name, index, store });
      return instance;
    };
  };
  const prePlugins = [buildPlugin('pre1'), buildPlugin('pre2')];
  const localPlugins = [buildPlugin('local1'), buildPlugin('local2')];
  const postPlugins = [buildPlugin('post1'), buildPlugin('post2')];
  const readInstalledGlobalPlugins = vi
    .spyOn(GlobalPlugins, 'readInstalledGlobalPlugins')
    .mockImplementation((position: 'pre' | 'post') => (position === 'pre' ? prePlugins : postPlugins));
  const defaultReporter = vi.spyOn(DefaultReporterPlugin, 'defaultReporter').mockReturnValue(buildPlugin('default'));
  return { localPlugins, instances, calls, defaultReporter, readInstalledGlobalPlugins };
}
