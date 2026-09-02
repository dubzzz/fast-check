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

const SMap = Map;

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

function runPluginCompletionHooksSync<Ts>(pluginInstances: PluginInstance<Ts>[], runDetails: RunDetails<Ts>) {
  let interceptedOnce = false;
  let interceptedError: unknown = undefined;
  for (let index = 0; index !== pluginInstances.length; ++index) {
    const instance = pluginInstances[index];
    if (instance.onAllRunsComplete !== undefined) {
      try {
        void instance.onAllRunsComplete(runDetails);
      } catch (error) {
        if (!interceptedOnce) {
          interceptedOnce = true;
          interceptedError = error;
        }
      }
    }
  }
  for (let index = pluginInstances.length - 1; index >= 0; --index) {
    const instance = pluginInstances[index];
    if (instance.afterAll !== undefined) {
      try {
        void instance.afterAll();
      } catch (error) {
        if (!interceptedOnce) {
          interceptedOnce = true;
          interceptedError = error;
        }
      }
    }
  }
  if (interceptedOnce) {
    throw interceptedError;
  }
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
  return runDetailsPromise.then((details) => {
    let interceptedOnce = false;
    let interceptedError: unknown = undefined;
    const interceptError = (error: unknown): void => {
      if (!interceptedOnce) {
        interceptedOnce = true;
        interceptedError = error;
      }
    };
    // Runs every hook from startIndex until one of them returns a promise: hooks running
    // synchronously never delay their successors to another microtask tick.
    const runFollowUpsFrom = (startIndex: number): { index: number; out: Promise<void> } | undefined => {
      for (let index = startIndex; index !== followUps.length; ++index) {
        try {
          const out = followUps[index](details);
          if (out !== undefined) {
            return { index, out };
          }
        } catch (error) {
          interceptError(error);
        }
      }
      return undefined;
    };
    const firstAsync = runFollowUpsFrom(0);
    if (firstAsync === undefined) {
      // Fully synchronous flow: no promise ever got involved
      if (interceptedOnce) {
        throw interceptedError;
      }
      return details;
    }
    // A hook returned a promise: from now on the traversal is driven by settlement
    // callbacks resolving one single deferred promise, no nested promises involved.
    return new Promise<RunDetails<Ts>>((resolve, reject) => {
      const resumeAfter = (pending: { index: number; out: Promise<void> }): void => {
        const resume = () => {
          const nextAsync = runFollowUpsFrom(pending.index + 1);
          if (nextAsync !== undefined) {
            resumeAfter(nextAsync);
          } else if (interceptedOnce) {
            reject(interceptedError);
          } else {
            resolve(details);
          }
        };
        pending.out.then(resume, (error) => {
          interceptError(error);
          resume();
        });
      };
      resumeAfter(firstAsync);
    });
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

  // Instantiate plugins
  const pluginStore = new SMap<symbol, any>();
  const pluginInstances: PluginInstance<Ts>[] = [];
  for (let index = 0; index !== globalPlugins.length; ++index) {
    pluginInstances.push(globalPlugins[index](index, pluginStore));
  }
  for (let index = 0; index !== localPlugins.length; ++index) {
    pluginInstances.push(localPlugins[index](globalPlugins.length + index, pluginStore));
  }

  // Apply and decorate with plugins
  let run: typeof property.run = property.isAsync()
    ? async (v) => asyncPropertyExecution(property, v)
    : (v) => propertyExecution(property, v);
  for (let index = pluginInstances.length - 1; index >= 0; --index) {
    const pluginInstance = pluginInstances[index];
    if (pluginInstance.decorateRun !== undefined) {
      run = pluginInstance.decorateRun(run);
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
    const out = asyncRunIt(run, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).then((e) =>
      e.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams),
    );
    return runPluginCompletionHooks(pluginInstances, out);
  }
  const out = runIt(run, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).toRunDetails(
    qParams.seed,
    qParams.path,
    maxSkips,
    qParams,
  );
  runPluginCompletionHooksSync(pluginInstances, out);
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
