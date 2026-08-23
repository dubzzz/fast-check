import { Stream, stream } from '../../stream/Stream.js';
import type { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { PropertyFailure, IRawProperty } from '../property/IRawProperty.js';
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
import { asyncReportRunDetails, reportRunDetails } from './utils/RunDetailsFormatter.js';
import type { IAsyncProperty } from '../property/AsyncProperty.js';
import type { IProperty } from '../property/Property.js';
import type { Value } from '../arbitrary/definition/Value.js';
import type { PluginInstance } from '../plugin/Plugin.js';
import { readInstalledGlobalPlugins } from './configuration/GlobalPlugins.js';

/** @internal */
function runIt<Ts>(
  property: IRawProperty<Ts>,
  decoratedRun: IRawProperty<Ts>['run'] | null,
  shrink: (value: Value<Ts>) => IterableIterator<Value<Ts>>,
  sourceValues: SourceValuesIterator<Value<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean,
): RunExecution<Ts> {
  const runner = new RunnerIterator(sourceValues, shrink, verbose, interruptedAsFailure);
  if (decoratedRun !== null) {
    for (const v of runner) {
      const out = decoratedRun(v) as PreconditionFailure | PropertyFailure | null;
      runner.handleResult(out);
    }
  } else {
    for (const v of runner) {
      (property.runBeforeEach as () => void)();
      const out = property.run(v) as PreconditionFailure | PropertyFailure | null;
      (property.runAfterEach as () => void)();
      runner.handleResult(out);
    }
  }
  return runner.runExecution;
}

function propertyExecution<Ts>(property: IRawProperty<Ts>, v: Ts) {
  (property.runBeforeEach as () => void)();
  const out = property.run(v) as PreconditionFailure | PropertyFailure | null;
  (property.runAfterEach as () => void)();
  return out;
}

/** @internal */
async function asyncRunIt<Ts>(
  property: IRawProperty<Ts>,
  decoratedRun: IRawProperty<Ts>['run'] | null,
  shrink: (value: Value<Ts>) => IterableIterator<Value<Ts>>,
  sourceValues: SourceValuesIterator<Value<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean,
): Promise<RunExecution<Ts>> {
  const runner = new RunnerIterator(sourceValues, shrink, verbose, interruptedAsFailure);
  if (decoratedRun !== null) {
    for (const v of runner) {
      const out = await decoratedRun(v);
      runner.handleResult(out);
    }
  } else {
    for (const v of runner) {
      await property.runBeforeEach();
      const out = await property.run(v);
      await property.runAfterEach();
      runner.handleResult(out);
    }
  }
  return runner.runExecution;
}

async function asyncPropertyExecution<Ts>(property: IRawProperty<Ts>, v: Ts) {
  await property.runBeforeEach();
  const out = await property.run(v);
  await property.runAfterEach();
  return out;
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
function check<Ts>(property: IAsyncProperty<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>>;
/**
 * Run the property, do not throw contrary to {@link assert}
 *
 * @param property - Synchronous property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @returns Test status and other useful details
 *
 * @remarks Since 0.0.1
 * @public
 */
function check<Ts>(property: IProperty<Ts>, params?: Parameters<Ts>): RunDetails<Ts>;
/**
 * Run the property, do not throw contrary to {@link assert}
 *
 * WARNING: Has to be awaited if the property is asynchronous
 *
 * @param property - Property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @returns Test status and other useful details
 *
 * @remarks Since 0.0.7
 * @public
 */
function check<Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>> | RunDetails<Ts>;
function check<Ts>(rawProperty: IRawProperty<Ts>, params?: Parameters<Ts>): unknown {
  if (
    rawProperty === null ||
    rawProperty === undefined ||
    rawProperty.generate === null ||
    rawProperty.generate === undefined
  )
    throw new Error('Invalid property encountered, please use a valid property');
  if (rawProperty.run === null || rawProperty.run === undefined)
    throw new Error('Invalid property encountered, please use a valid property not an arbitrary');
  const qParams: QualifiedParameters<Ts> = read<Ts>({
    ...(readConfigureGlobal() as Parameters<Ts>),
    ...params,
  });
  if (qParams.reporter !== undefined && qParams.asyncReporter !== undefined)
    throw new Error('Invalid parameters encountered, reporter and asyncReporter cannot be specified together');
  if (qParams.asyncReporter !== undefined && !rawProperty.isAsync())
    throw new Error('Invalid parameters encountered, only asyncProperty can be used when asyncReporter specified');
  const property = decorateProperty(rawProperty, qParams);

  const globalPlugins = readInstalledGlobalPlugins();
  const localPlugins = qParams.plugins;
  const numPlugins = globalPlugins.length + localPlugins.length;

  // Instantiate plugins, then apply and decorate with them.
  // The most frequent case being "no plugin at all", it fully bypasses the plugins machinery:
  // it keeps run being null so that runIt and asyncRunIt can directly deal with the property.
  let run: typeof property.run | null = null;
  let pluginAfterAllCallbacks: Required<PluginInstance<Ts>>['afterAll'][] | null = null;
  if (numPlugins !== 0) {
    const crossPluginContext: { [K in any]?: unknown } = {};
    const pluginInstances: PluginInstance<Ts>[] = [];
    for (let index = 0; index !== globalPlugins.length; ++index) {
      pluginInstances.push(globalPlugins[index](index, crossPluginContext));
    }
    for (let index = 0; index !== localPlugins.length; ++index) {
      pluginInstances.push(localPlugins[index](globalPlugins.length + index, crossPluginContext));
    }
    for (let index = numPlugins - 1; index >= 0; --index) {
      const pluginInstance = pluginInstances[index];
      if (pluginInstance.decorateRun !== undefined) {
        if (run === null) {
          // The innermost run is only materialized if a plugin really decorates it
          run = property.isAsync() ? (v) => asyncPropertyExecution(property, v) : (v) => propertyExecution(property, v);
        }
        run = pluginInstance.decorateRun(run);
      }
      if (pluginInstance.afterAll !== undefined) {
        if (pluginAfterAllCallbacks === null) {
          pluginAfterAllCallbacks = [];
        }
        pluginAfterAllCallbacks.push(pluginInstance.afterAll.bind(pluginInstance));
      }
    }
  }

  const maxInitialIterations = qParams.path.length === 0 || qParams.path.indexOf(':') === -1 ? qParams.numRuns : -1;
  const maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
  const shrink: typeof property.shrink = (...args) => property.shrink(...args);
  const initialValues =
    qParams.path.length === 0
      ? toss(property, qParams.seed, qParams.randomType, qParams.examples)
      : pathWalk(qParams.path, stream(lazyToss(property, qParams.seed, qParams.randomType, qParams.examples)), shrink);
  const sourceValues = new SourceValuesIterator(initialValues, maxInitialIterations, maxSkips);
  const finalShrink = !qParams.endOnFailure ? shrink : Stream.nil;
  if (property.isAsync()) {
    const out = asyncRunIt(
      property,
      run,
      finalShrink,
      sourceValues,
      qParams.verbose,
      qParams.markInterruptAsFailure,
    ).then((e) => e.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams));
    if (pluginAfterAllCallbacks === null) {
      return out;
    }
    const afterAllCallbacks = pluginAfterAllCallbacks;
    return out.then((details) => {
      let queued = afterAllCallbacks[0](details);
      for (let index = 1; index < afterAllCallbacks.length; ++index) {
        const afterAll = afterAllCallbacks[index];
        queued = queued === undefined ? afterAll(details) : queued.then(() => afterAll(details));
      }
      return queued === undefined ? details : queued.then(() => details);
    });
  }
  const out = runIt(
    property,
    run,
    finalShrink,
    sourceValues,
    qParams.verbose,
    qParams.markInterruptAsFailure,
  ).toRunDetails(qParams.seed, qParams.path, maxSkips, qParams);
  if (pluginAfterAllCallbacks !== null) {
    for (let index = 0; index !== pluginAfterAllCallbacks.length; ++index) {
      (pluginAfterAllCallbacks[index] as (details: RunDetails<Ts>) => void)(out);
    }
  }
  return out;
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
function assert<Ts>(property: IAsyncProperty<Ts>, params?: Parameters<Ts>): Promise<void>;
/**
 * Run the property, throw in case of failure
 *
 * It can be called directly from describe/it blocks of Mocha.
 * No meaningful results are produced in case of success.
 *
 * @param property - Synchronous property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @remarks Since 0.0.1
 * @public
 */
function assert<Ts>(property: IProperty<Ts>, params?: Parameters<Ts>): void;
/**
 * Run the property, throw in case of failure
 *
 * It can be called directly from describe/it blocks of Mocha.
 * No meaningful results are produced in case of success.
 *
 * WARNING: Returns a promise to be awaited if the property is asynchronous
 *
 * @param property - Synchronous or asynchronous property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @remarks Since 0.0.7
 * @public
 */
function assert<Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): Promise<void> | void;
function assert<Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): unknown {
  const out = check(property, params);
  if (property.isAsync()) return (out as Promise<RunDetails<Ts>>).then(asyncReportRunDetails);
  else reportRunDetails(out as RunDetails<Ts>) as void;
}

export { check, assert };
