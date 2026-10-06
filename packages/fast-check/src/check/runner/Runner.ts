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
  applyPluginDecorators,
  extractPluginCompletionCallbacks,
  instantiatePlugins,
} from './utils/PluginIntegration.js';
import { runAllCallbacksAndReturn } from './utils/AllCallbacksThenReturnRunner.js';

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
  const { generator, run } = applyPluginDecorators(property, pluginInstances);

  const maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
  const runnerIterator = createRunnerIterator(property, generator, qParams, maxSkips);
  const propertyRunnerOut = propertyRunner(runnerIterator, run);
  const completionCallbacks = extractPluginCompletionCallbacks(pluginInstances);
  return propertyRunnerOut === undefined
    ? Promise.resolve(
        runAllCallbacksAndReturn(
          runnerIterator.runExecution.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams),
          completionCallbacks,
        ),
      )
    : propertyRunnerOut.then(() =>
        runAllCallbacksAndReturn(
          runnerIterator.runExecution.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams),
          completionCallbacks,
        ),
      );
}

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
function assert<Ts>(property: Property<Ts>, params?: Parameters<Ts>): Promise<void> {
  const out = check(property, params);
  return out.then(reportRunDetails);
}

export { check, assert };
