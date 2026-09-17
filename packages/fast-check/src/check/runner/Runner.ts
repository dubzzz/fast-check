import { Stream, stream } from '../../stream/Stream.js';
import type { Property } from '../property/types/Property.js';
import { readConfigureGlobal } from './configuration/GlobalParameters.js';
import type { Parameters } from './configuration/Parameters.js';
import { read } from './configuration/QualifiedParameters.js';
import type { QualifiedParameters } from './configuration/QualifiedParameters.js';
import type { VerbosityLevel } from './configuration/VerbosityLevel.js';
import { decorateProperty } from './DecorateProperty.js';
import type { RunDetails } from './reporter/RunDetails.js';
import type { RunExecution } from './reporter/RunExecution.js';
import { RunnerIterator } from './RunnerIterator.js';
import { SourceValuesIterator } from './SourceValuesIterator.js';
import { lazyToss, toss } from './Tosser.js';
import { pathWalk } from './utils/PathWalker.js';
import { asyncReportRunDetails } from './utils/RunDetailsFormatter.js';
import type { Value } from '../arbitrary/definition/Value.js';
import type { PluginInstance } from '../plugin/Plugin.js';
import { readInstalledGlobalPlugins } from './configuration/GlobalPlugins.js';

/** @internal */
async function runIt<Ts>(
  run: Property<Ts>['run'],
  shrink: (value: Value<Ts>) => IterableIterator<Value<Ts>>,
  sourceValues: SourceValuesIterator<Value<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean,
): Promise<RunExecution<Ts>> {
  const runner = new RunnerIterator(sourceValues, shrink, verbose, interruptedAsFailure);
  for (const v of runner) {
    // TODO(v5) - Still awaiting for now, ideally we should avoid as much as possible awaiting (but here we have a Promise by construct)
    const out = await run(v);
    runner.handleResult(out);
  }
  return runner.runExecution;
}

async function propertyExecution<Ts>(property: Property<Ts>, v: Ts) {
  const beforeEachOut = property.runBeforeEach();
  if (beforeEachOut !== undefined) {
    await beforeEachOut;
  }
  const syncOut = property.run(v);
  // Awaiting on an already resolved value brings a performance drop.
  // As such we try to only await on Promises. Given the shape of the values produced by run
  // we do a best effort check and drop unwanted await calls only on synchronous success cases.
  const out = syncOut !== null ? await syncOut : syncOut;
  const afterEachOut = property.runAfterEach();
  if (afterEachOut !== undefined) {
    await afterEachOut;
  }
  return out;
}

function runPluginCompletionHooks<Ts>(
  pluginInstances: PluginInstance<Ts>[],
  runDetailsPromise: Promise<RunDetails<Ts>>,
): Promise<RunDetails<Ts>> {
  const followUps: NonNullable<PluginInstance<Ts>['onAllRunsComplete']>[] = [];
  for (let index = 0; index !== pluginInstances.length; ++index) {
    const instance = pluginInstances[index];
    if (instance.onAllRunsComplete !== undefined) {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      followUps.push((runDetails) => instance.onAllRunsComplete!(runDetails));
    }
  }
  for (let index = pluginInstances.length - 1; index >= 0; --index) {
    const instance = pluginInstances[index];
    if (instance.afterAll !== undefined) {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      followUps.push(() => instance.afterAll!());
    }
  }
  if (followUps.length === 0) {
    return runDetailsPromise;
  }
  return runDetailsPromise.then(async (details) => {
    let interceptedOnce = false;
    let interceptedError: unknown = undefined;
    for (const followUp of followUps) {
      try {
        const out = followUp(details);
        if (out !== undefined) {
          await out;
        }
      } catch (error) {
        if (!interceptedOnce) {
          interceptedOnce = true;
          interceptedError = error;
        }
      }
    }
    if (interceptedOnce) {
      throw interceptedError;
    }
    return details;
  });
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
  if (property === null || property === undefined || property.generate === null || property.generate === undefined)
    throw new Error('Invalid property encountered, please use a valid property');
  if (property.run === null || property.run === undefined)
    throw new Error('Invalid property encountered, please use a valid property not an arbitrary');
  const qParams: QualifiedParameters<Ts> = read<Ts>({
    ...(readConfigureGlobal() as Parameters<Ts>),
    ...params,
  });
  if (qParams.reporter !== undefined && qParams.asyncReporter !== undefined)
    throw new Error('Invalid parameters encountered, reporter and asyncReporter cannot be specified together');
  const decoratedProperty = decorateProperty(property, qParams);

  const globalPlugins = readInstalledGlobalPlugins();
  const localPlugins = qParams.plugins;

  // Instantiate plugins
  const pluginStore = new Map<symbol, any>();
  const pluginInstances: PluginInstance<Ts>[] = [];
  for (let index = 0; index !== globalPlugins.length; ++index) {
    pluginInstances.push(globalPlugins[index](index, pluginStore));
  }
  for (let index = 0; index !== localPlugins.length; ++index) {
    pluginInstances.push(localPlugins[index](globalPlugins.length + index, pluginStore));
  }

  // Apply and decorate with plugins
  let surchargedGenerate: typeof decoratedProperty.generate | undefined = undefined;
  let run: typeof decoratedProperty.run = (v) => propertyExecution(decoratedProperty, v);
  for (let index = pluginInstances.length - 1; index >= 0; --index) {
    const pluginInstance = pluginInstances[index];
    if (pluginInstance.decorateGenerate !== undefined) {
      if (surchargedGenerate === undefined) {
        surchargedGenerate = (mrng, runId) => decoratedProperty.generate(mrng, runId);
      }
      surchargedGenerate = pluginInstance.decorateGenerate(surchargedGenerate);
    }
    if (pluginInstance.decorateRun !== undefined) {
      run = pluginInstance.decorateRun(run);
    }
  }

  const generator = surchargedGenerate === undefined ? decoratedProperty : { generate: surchargedGenerate };
  const maxInitialIterations = qParams.path.length === 0 || qParams.path.indexOf(':') === -1 ? qParams.numRuns : -1;
  const maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
  const shrink: typeof decoratedProperty.shrink = (...args) => decoratedProperty.shrink(...args);
  const initialValues =
    qParams.path.length === 0
      ? toss(generator, qParams.seed, qParams.randomType, qParams.examples)
      : pathWalk(qParams.path, stream(lazyToss(generator, qParams.seed, qParams.randomType, qParams.examples)), shrink);
  const sourceValues = new SourceValuesIterator(initialValues, maxInitialIterations, maxSkips);
  const finalShrink = !qParams.endOnFailure ? shrink : Stream.nil;
  const out = runIt(run, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).then((e) =>
    e.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams),
  );
  return runPluginCompletionHooks(pluginInstances, out);
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
  return out.then(asyncReportRunDetails);
}

export { check, assert };
