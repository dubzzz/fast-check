import { Stream, stream } from '../../stream/Stream';
import type { PreconditionFailure } from '../precondition/PreconditionFailure';
import type { PropertyFailure, IRawProperty } from '../property/IRawProperty';
import { readConfigureGlobal } from './configuration/GlobalParameters';
import type { Parameters } from './configuration/Parameters';
import { QualifiedParameters } from './configuration/QualifiedParameters';
import type { VerbosityLevel } from './configuration/VerbosityLevel';
import { decorateProperty } from './DecorateProperty';
import type { RunDetails } from './reporter/RunDetails';
import type { RunExecution } from './reporter/RunExecution';
import { RunnerIterator } from './RunnerIterator';
import { SourceValuesIterator } from './SourceValuesIterator';
import { lazyToss, toss } from './Tosser';
import { pathWalk } from './utils/PathWalker';
import { asyncReportRunDetails, reportRunDetails } from './utils/RunDetailsFormatter';
import type { IAsyncProperty } from '../property/AsyncProperty';
import type { IProperty } from '../property/Property';
import type { Value } from '../arbitrary/definition/Value';

const safeObjectAssign = Object.assign;

/** @internal */
function runIt<Ts>(
  property: IRawProperty<Ts>,
  shrink: (value: Value<Ts>) => IterableIterator<Value<Ts>>,
  sourceValues: SourceValuesIterator<Value<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean,
): RunExecution<Ts> {
  const runner = new RunnerIterator(sourceValues, shrink, verbose, interruptedAsFailure);
  for (const v of runner) {
    (property.runBeforeEach as () => void)();
    const out = property.run(v) as PreconditionFailure | PropertyFailure | null;
    (property.runAfterEach as () => void)();
    runner.handleResult(out);
  }
  return runner.runExecution;
}

/** @internal */
async function asyncRunIt<Ts>(
  property: IRawProperty<Ts>,
  shrink: (value: Value<Ts>) => IterableIterator<Value<Ts>>,
  sourceValues: SourceValuesIterator<Value<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean,
): Promise<RunExecution<Ts>> {
  const runner = new RunnerIterator(sourceValues, shrink, verbose, interruptedAsFailure);
  for (const v of runner) {
    await property.runBeforeEach();
    const out = await property.run(v);
    await property.runAfterEach();
    runner.handleResult(out);
  }
  return runner.runExecution;
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
  if (rawProperty == null || rawProperty.generate == null)
    throw new Error('Invalid property encountered, please use a valid property');
  if (rawProperty.run == null)
    throw new Error('Invalid property encountered, please use a valid property not an arbitrary');
  const qParams: QualifiedParameters<Ts> = QualifiedParameters.read<Ts>(
    // TODO - Move back to object spreading as soon as we bump support from es2017 to es2018+
    safeObjectAssign(safeObjectAssign({}, readConfigureGlobal() as Parameters<Ts>), params),
  );
  if (qParams.reporter !== null && qParams.asyncReporter !== null)
    throw new Error('Invalid parameters encountered, reporter and asyncReporter cannot be specified together');
  if (qParams.asyncReporter !== null && !rawProperty.isAsync())
    throw new Error('Invalid parameters encountered, only asyncProperty can be used when asyncReporter specified');
  const property = decorateProperty(rawProperty, qParams);

  const maxInitialIterations = qParams.path.length === 0 || qParams.path.indexOf(':') === -1 ? qParams.numRuns : -1;
  const maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
  const shrink: typeof property.shrink = (...args) => property.shrink(...args);
  const initialValues =
    qParams.path.length === 0
      ? toss(property, qParams.seed, qParams.randomType, qParams.examples)
      : pathWalk(qParams.path, stream(lazyToss(property, qParams.seed, qParams.randomType, qParams.examples)), shrink);
  const sourceValues = new SourceValuesIterator(initialValues, maxInitialIterations, maxSkips);
  const finalShrink = !qParams.endOnFailure ? shrink : Stream.nil;
  return property.isAsync()
    ? asyncRunIt(property, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).then((e) =>
        e.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams),
      )
    : runIt(property, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).toRunDetails(
        qParams.seed,
        qParams.path,
        maxSkips,
        qParams,
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
