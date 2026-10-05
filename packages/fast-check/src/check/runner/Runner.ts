import { nil } from '../../utils/iterator.js';
import type { Property } from '../property/types/Property.js';
import { readConfigureGlobal } from './configuration/GlobalParameters.js';
import type { Parameters } from './configuration/Parameters.js';
import { read } from './configuration/QualifiedParameters.js';
import type { QualifiedParameters } from './configuration/QualifiedParameters.js';
import type { RunDetails } from './reporter/RunDetails.js';
import { propertyRunner } from './PropertyRunner.js';
import { RunnerIterator } from './RunnerIterator.js';
import { SourceValuesIterator } from './SourceValuesIterator.js';
import { lazyToss, toss } from './Tosser.js';
import { pathWalk } from './utils/PathWalker.js';
import { reportRunDetails } from './utils/RunDetailsFormatter.js';
import { runAllCallbacksAndReturn } from './utils/AllCallbacksThenReturnRunner.js';
import {
  applyPluginDecorators,
  extractPluginCompletionCallbacks,
  instantiatePlugins,
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
  const { generator, run } = applyPluginDecorators(property, pluginInstances);

  const maxInitialIterations = qParams.path.length === 0 || qParams.path.indexOf(':') === -1 ? qParams.numRuns : -1;
  const maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
  const shrink: typeof property.shrink = (...args) => property.shrink(...args);
  const initialValues =
    qParams.path.length === 0
      ? toss(generator, qParams.seed, qParams.randomType, qParams.examples)
      : pathWalk(qParams.path, lazyToss(generator, qParams.seed, qParams.randomType, qParams.examples), shrink);
  const runnerIterator = new RunnerIterator(
    new SourceValuesIterator(initialValues, maxInitialIterations, maxSkips),
    !qParams.endOnFailure ? shrink : () => nil,
    qParams.verbose,
  );
  const propertyRunnerOut = propertyRunner(runnerIterator, run);
  const followUps = extractPluginCompletionCallbacks(pluginInstances);
  return propertyRunnerOut === undefined
    ? Promise.resolve(
        runAllCallbacksAndReturn(
          runnerIterator.runExecution.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams),
          followUps,
        ),
      )
    : propertyRunnerOut.then(() =>
        runAllCallbacksAndReturn(
          runnerIterator.runExecution.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams),
          followUps,
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
