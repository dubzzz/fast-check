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
import type { Plugin, PluginInstance } from '../plugin/Plugin.js';

/** @internal */
function runIt<Ts>(
  run: IRawProperty<Ts>['run'],
  shrink: (value: Value<Ts>) => IterableIterator<Value<Ts>>,
  sourceValues: SourceValuesIterator<Value<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean,
): RunExecution<Ts> {
  const runner = new RunnerIterator(sourceValues, shrink, verbose, interruptedAsFailure);
  for (const v of runner) {
    const out = run(v) as PreconditionFailure | PropertyFailure | null;
    runner.handleResult(out);
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
  run: IRawProperty<Ts>['run'],
  shrink: (value: Value<Ts>) => IterableIterator<Value<Ts>>,
  sourceValues: SourceValuesIterator<Value<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean,
): Promise<RunExecution<Ts>> {
  const runner = new RunnerIterator(sourceValues, shrink, verbose, interruptedAsFailure);
  for (const v of runner) {
    const out = await run(v);
    runner.handleResult(out);
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

  const pluginSharedSessionContext: { [K in any]?: unknown } = {};
  const plugins: Plugin<Ts, boolean>[] = [];
  const pluginEndSessionCallbacks: Required<PluginInstance<Ts, boolean>>['endSession'][] = [];
  let run: typeof property.run = property.isAsync()
    ? async (v) => asyncPropertyExecution(property, v)
    : (v) => propertyExecution(property, v);
  for (let index = 0; index !== plugins.length; ++index) {
    const pluginInstance = plugins[index](pluginSharedSessionContext);
    if (pluginInstance.asyncOnly && !property.isAsync()) {
      throw new Error('Cannot execute an asynchronous plugin on a synchronous property');
    }
    if ('decorateRun' in pluginInstance && pluginInstance.decorateRun !== undefined) {
      run = pluginInstance.decorateRun(run);
    }
    if ('endSession' in pluginInstance && pluginInstance.endSession !== undefined) {
      pluginEndSessionCallbacks.push(pluginInstance.endSession.bind(pluginInstance));
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
    let out = asyncRunIt(run, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).then((e) =>
      e.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams),
    );
    for (let index = 0; index !== pluginEndSessionCallbacks.length; ++index) {
      const end = pluginEndSessionCallbacks[index];
      out = out.finally(end as () => void);
    }
    return out;
  }
  const out = runIt(run, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).toRunDetails(
    qParams.seed,
    qParams.path,
    maxSkips,
    qParams,
  );
  for (let index = 0; index !== pluginEndSessionCallbacks.length; ++index) {
    (pluginEndSessionCallbacks[index] as () => void)();
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
