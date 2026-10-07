import type { Plugin, PluginInstance } from '../../plugin/Plugin.js';
import type { Property } from '../../property/types/Property.js';
import { readInstalledGlobalPlugins } from '../configuration/GlobalPlugins.js';
import type { RunDetails } from '../reporter/RunDetails.js';
import { runAllCallbacksAndReturn } from './AllCallbacksThenReturnRunner.js';

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

export function applyPluginGeneratorDecorators<Ts>(
  property: Property<Ts>,
  pluginInstances: PluginInstance<Ts>[],
): Pick<Property<Ts>, 'generate'> {
  let decoratedGenerate: typeof property.generate | undefined = undefined;
  for (let index = pluginInstances.length - 1; index >= 0; --index) {
    const pluginInstance = pluginInstances[index];
    if (pluginInstance.decorateGenerate !== undefined) {
      if (decoratedGenerate === undefined) {
        decoratedGenerate = (mrng, runId) => property.generate(mrng, runId);
      }
      decoratedGenerate = pluginInstance.decorateGenerate(decoratedGenerate);
    }
  }
  return decoratedGenerate === undefined ? property : { generate: decoratedGenerate };
}

export function applyPluginRunDecorators<Ts>(
  property: Property<Ts>,
  pluginInstances: PluginInstance<Ts>[],
): Property<Ts>['run'] {
  let run: typeof property.run = (v) => property.run(v);
  for (let index = pluginInstances.length - 1; index >= 0; --index) {
    const pluginInstance = pluginInstances[index];
    if (pluginInstance.decorateRun !== undefined) {
      run = pluginInstance.decorateRun(run);
    }
  }
  return run;
}

export function runPluginCompletionCallbacks<Ts>(
  pluginInstances: PluginInstance<Ts>[],
  runDetails: RunDetails<Ts>,
): RunDetails<Ts> | Promise<RunDetails<Ts>> {
  if (pluginInstances.length === 0) {
    return runDetails;
  }
  const halfCount = pluginInstances.length;
  const count = halfCount * 2;
  return runAllCallbacksAndReturn(
    runDetails,
    (index) =>
      index < halfCount
        ? pluginInstances[index].onAllRunsComplete?.(runDetails)
        : pluginInstances[count - index - 1].afterAll?.(),
    count,
  );
}
