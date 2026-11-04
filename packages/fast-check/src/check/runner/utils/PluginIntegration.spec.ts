import { describe, expect, it, vi } from 'vitest';
import * as DefaultReporterPlugin from '../../plugin/DefaultReporterPlugin.js';
import type { PluginInstance, PluginStore, UniversalPlugin } from '../../plugin/Plugin.js';
import * as GlobalPlugins from '../configuration/GlobalPlugins.js';
import { instantiatePlugins } from './PluginIntegration.js';

describe('instantiatePlugins', () => {
  it('should instantiate pre, local, post and default plugins in order', () => {
    // Arrange
    const { localPlugins, instances, calls, defaultReporter } = setupPlugins();

    // Act
    const out = instantiatePlugins(localPlugins, true, true);

    // Assert
    expect(out).toEqual([
      instances.pre1,
      instances.pre2,
      instances.local1,
      instances.local2,
      instances.post1,
      instances.post2,
      instances.default,
    ]);
    expect(calls.map(({ name }) => name)).toEqual(['pre1', 'pre2', 'local1', 'local2', 'post1', 'post2', 'default']);
    expect(calls.map(({ index }) => index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(new Set(calls.map(({ store }) => store)).size).toBe(1);
    expect(defaultReporter).toHaveBeenCalledExactlyOnceWith();
  });

  it('should skip default plugins while keeping global plugins', () => {
    // Arrange
    const { localPlugins, instances, calls, defaultReporter } = setupPlugins();

    // Act
    const out = instantiatePlugins(localPlugins, false, true);

    // Assert
    expect(out).toEqual([
      instances.pre1,
      instances.pre2,
      instances.local1,
      instances.local2,
      instances.post1,
      instances.post2,
    ]);
    expect(calls.map(({ name }) => name)).toEqual(['pre1', 'pre2', 'local1', 'local2', 'post1', 'post2']);
    expect(calls.map(({ index }) => index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(defaultReporter).not.toHaveBeenCalled();
  });

  it('should skip global plugins while keeping default plugins', () => {
    // Arrange
    const { localPlugins, instances, calls, defaultReporter, readInstalledGlobalPlugins } = setupPlugins();

    // Act
    const out = instantiatePlugins(localPlugins, true, false);

    // Assert
    expect(out).toEqual([instances.local1, instances.local2, instances.default]);
    expect(calls.map(({ name }) => name)).toEqual(['local1', 'local2', 'default']);
    expect(calls.map(({ index }) => index)).toEqual([0, 1, 2]);
    expect(readInstalledGlobalPlugins).not.toHaveBeenCalled();
    expect(defaultReporter).toHaveBeenCalledExactlyOnceWith();
  });

  it('should instantiate only local plugins when globals and defaults are disabled', () => {
    // Arrange
    const { localPlugins, instances, calls, defaultReporter, readInstalledGlobalPlugins } = setupPlugins();

    // Act
    const out = instantiatePlugins(localPlugins, false, false);

    // Assert
    expect(out).toEqual([instances.local1, instances.local2]);
    expect(calls.map(({ name }) => name)).toEqual(['local1', 'local2']);
    expect(calls.map(({ index }) => index)).toEqual([0, 1]);
    expect(readInstalledGlobalPlugins).not.toHaveBeenCalled();
    expect(defaultReporter).not.toHaveBeenCalled();
  });
});

// Helpers

function setupPlugins() {
  const calls: { name: string; index: number; store: PluginStore }[] = [];
  const instances: Record<string, PluginInstance<unknown>> = {};
  const buildPlugin = (name: string): UniversalPlugin => {
    const instance = { afterAll: vi.fn() };
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
    .mockImplementation((position) => (position === 'pre' ? prePlugins : postPlugins));
  const defaultReporter = vi.spyOn(DefaultReporterPlugin, 'defaultReporter').mockReturnValue(buildPlugin('default'));
  return { localPlugins, instances, calls, defaultReporter, readInstalledGlobalPlugins };
}
