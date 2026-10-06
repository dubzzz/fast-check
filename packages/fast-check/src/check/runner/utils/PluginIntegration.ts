import type { Plugin, PluginInstance } from '../../plugin/Plugin.js';
import type { Property } from '../../property/types/Property.js';
import { readInstalledGlobalPlugins } from '../configuration/GlobalPlugins.js';

export function instantiatePlugins<Ts>(localPlugins: Plugin<Ts>[]): PluginInstance<Ts>[] {
  const globalPlugins = readInstalledGlobalPlugins();
  const pluginStore = new Map<symbol, any>();
  const pluginInstances: PluginInstance<Ts>[] = [];
  for (let index = 0; index !== globalPlugins.length; ++index) {
    pluginInstances.push(globalPlugins[index](index, pluginStore));
  }
  for (let index = 0; index !== localPlugins.length; ++index) {
    pluginInstances.push(localPlugins[index](globalPlugins.length + index, pluginStore));
  }
  return pluginInstances;
}

export function applyPluginDecorators<Ts>(
  property: Property<Ts>,
  pluginInstances: PluginInstance<Ts>[],
): { generator: Pick<Property<Ts>, 'generate'>; run: Property<Ts>['run'] } {
  let decoratedGenerate: typeof property.generate | undefined = undefined;
  let run: typeof property.run = (v) => property.run(v);
  for (let index = pluginInstances.length - 1; index >= 0; --index) {
    const pluginInstance = pluginInstances[index];
    if (pluginInstance.decorateGenerate !== undefined) {
      if (decoratedGenerate === undefined) {
        decoratedGenerate = (mrng, runId) => property.generate(mrng, runId);
      }
      decoratedGenerate = pluginInstance.decorateGenerate(decoratedGenerate);
    }
    if (pluginInstance.decorateRun !== undefined) {
      run = pluginInstance.decorateRun(run);
    }
  }
  const generator = decoratedGenerate === undefined ? property : { generate: decoratedGenerate };
  return { generator, run };
}

export function extractPluginCompletionCallbacks<Ts>(
  pluginInstances: PluginInstance<Ts>[],
): NonNullable<PluginInstance<Ts>['onAllRunsComplete']>[] {
  const completionCallbacks: NonNullable<PluginInstance<Ts>['onAllRunsComplete']>[] = [];
  for (let index = 0; index !== pluginInstances.length; ++index) {
    const instance = pluginInstances[index];
    if (instance.onAllRunsComplete !== undefined) {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      completionCallbacks.push((runDetails) => instance.onAllRunsComplete!(runDetails));
    }
  }
  for (let index = pluginInstances.length - 1; index >= 0; --index) {
    const instance = pluginInstances[index];
    if (instance.afterAll !== undefined) {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      completionCallbacks.push(() => instance.afterAll!());
    }
  }
  return completionCallbacks;
}
