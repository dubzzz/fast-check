import type { Property } from '../property/types/Property.js';
import { readConfigureGlobal } from './configuration/GlobalParameters.js';
import type { Parameters } from './configuration/Parameters.js';
import { read } from './configuration/QualifiedParameters.js';
import type { QualifiedParameters } from './configuration/QualifiedParameters.js';
import type { RunDetails } from './reporter/RunDetails.js';
import { propertyRunner } from './PropertyRunner.js';
import { createRunnerIterator } from './utils/RunnerIteratorBuilder.js';
import { reportRunDetails } from './utils/RunDetailsFormatter.js';
import {
  applyPluginGeneratorDecorators,
  applyPluginRunDecorators,
  instantiatePlugins,
  runPluginCompletionCallbacks,
} from './utils/PluginIntegration.js';

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
  const qParams: QualifiedParameters<Ts> = read<Ts>({
    ...(readConfigureGlobal() as Parameters<Ts>),
    ...params,
  });
  const pluginInstances = instantiatePlugins(qParams.plugins);
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
 * Run the property without default plugins, returning the same details as {@link check}
 *
 * Plugins explicitly passed or installed globally are still executed and may throw.
 *
 * WARNING: Has to be awaited
 *
 * @param property - Property to be checked
 * @param params - Parameters disabling default plugins
 *
 * @returns Test status and other useful details
 *
 * @remarks Since 5.0.0
 * @public
 */
function assert<Ts>(
  property: Property<Ts>,
  params: Parameters<Ts> & { noDefaultPlugins: true },
): Promise<RunDetails<Ts>>;
/**
 * Run the property, throw in case of failure
 *
 * It can be called directly from describe/it blocks of Mocha.
 * No meaningful results are produced in case of success.
 *
 * WARNING: Has to be awaited
 *
 * @param property - Asynchronous property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @remarks Since 0.0.7
 * @public
 */
function assert<Ts>(property: Property<Ts>, params?: Parameters<Ts> & { noDefaultPlugins?: false }): Promise<void>;
/**
 * Run the property, reporting failures unless `noDefaultPlugins` is enabled
 *
 * WARNING: Has to be awaited
 *
 * @param property - Property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @returns Test status and other useful details when `noDefaultPlugins` is enabled, otherwise nothing
 *
 * @remarks Since 0.0.7
 * @public
 */
function assert<Ts>(property: Property<Ts>, params?: Parameters<Ts>): Promise<void | RunDetails<Ts>>;
function assert<Ts>(property: Property<Ts>, params?: Parameters<Ts>): Promise<void | RunDetails<Ts>> {
  const out = check(property, params);
  return out.then((runDetails) => {
    if (runDetails.runConfiguration.noDefaultPlugins) {
      return runDetails;
    }
    return reportRunDetails(runDetails);
  });
}

export { check, assert };
