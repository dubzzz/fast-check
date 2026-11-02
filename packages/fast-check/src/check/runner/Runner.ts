import type { Property } from '../property/types/Property.js';
import { readConfigureGlobal } from './configuration/GlobalParameters.js';
import type { Parameters } from './configuration/Parameters.js';
import { read } from './configuration/QualifiedParameters.js';
import type { QualifiedParameters } from './configuration/QualifiedParameters.js';
import type { RunDetails } from './reporter/RunDetails.js';
import { propertyRunner } from './PropertyRunner.js';
import { createRunnerIterator } from './utils/RunnerIteratorBuilder.js';
import { defaultReporter } from './utils/RunDetailsFormatter.js';
import {
  applyPluginGeneratorDecorators,
  applyPluginRunDecorators,
  instantiatePlugins,
  runPluginCompletionCallbacks,
} from './utils/PluginIntegration.js';

function checkInternal<Ts>(property: Property<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>> {
  const qParams: QualifiedParameters<Ts> = read<Ts>({
    ...(readConfigureGlobal() as Parameters<Ts>),
    ...params,
  });
  const pluginInstances = instantiatePlugins(
    qParams.noDefaultPlugins ? qParams.plugins : [...qParams.plugins, defaultReporter()],
  );
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

/**
 * Run the property, do not throw contrary to {@link assert}
 *
 * WARNING: Has to be awaited
 *
 * @param property - Asynchronous property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @returns Test status and other useful details
 *
 * @remarks Since 0.0.7
 * @public
 */
function check<Ts>(property: Property<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>> {
  return checkInternal(property, { ...params, noDefaultPlugins: true });
}

/**
 * Run the property and reject if a plugin reports the run as an error
 *
 * With the default setup, failed runs are rejected.
 *
 * It can be called directly from describe/it blocks of Mocha.
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
function assert<Ts>(property: Property<Ts>, params?: Parameters<Ts>): Promise<void> {
  const out = checkInternal(property, params);
  return out.then(() => undefined);
}

export { check, assert };
