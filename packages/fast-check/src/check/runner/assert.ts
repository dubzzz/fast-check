import type { Property } from '../property/types/Property.js';
import { readConfigureGlobal } from './configuration/GlobalParameters.js';
import type { Parameters } from './configuration/Parameters.js';
import { read } from './configuration/QualifiedParameters.js';
import type { QualifiedParameters } from './configuration/QualifiedParameters.js';
import { propertyRunner } from './PropertyRunner.js';
import { createRunnerIterator } from './utils/RunnerIteratorBuilder.js';
import {
  applyPluginGeneratorDecorators,
  applyPluginRunDecorators,
  instantiatePlugins,
  runPluginCompletionCallbacks,
} from './utils/PluginIntegration.js';

/**
 * Run the property and reject if a plugin reports the run as an error
 *
 * With the default setup, failed runs are rejected.
 *
 * It can be called directly from describe/it blocks of your favorite test runner.
 * No meaningful results are produced. Use a plugin's `onAllRunsComplete` callback to access run details.
 *
 * WARNING: Has to be awaited
 *
 * @param property - Asynchronous property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @remarks Since 0.0.7
 * @public
 */
export function assert<Ts>(property: Property<Ts>, params?: Parameters<Ts>): Promise<void> {
  const qParams: QualifiedParameters<Ts> = read<Ts>({
    ...(readConfigureGlobal() as Parameters<Ts>),
    ...params,
  });
  const pluginInstances = instantiatePlugins(qParams.plugins, !qParams.noDefaultPlugins, !qParams.noGlobalPlugins);
  const generator = applyPluginGeneratorDecorators(property, pluginInstances);
  const run = applyPluginRunDecorators(property, pluginInstances);

  const maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
  const runnerIterator = createRunnerIterator(property, generator, qParams, maxSkips);
  const propertyRunnerOut = propertyRunner(runnerIterator, run);
  return propertyRunnerOut === undefined
    ? Promise.resolve(
        runPluginCompletionCallbacks(
          pluginInstances,
          runnerIterator.runExecution.toRunDetails(qParams.seed, qParams.path, qParams),
        ),
      )
    : propertyRunnerOut.then(() =>
        runPluginCompletionCallbacks(
          pluginInstances,
          runnerIterator.runExecution.toRunDetails(qParams.seed, qParams.path, qParams),
        ),
      );
}
