import { Stream, stream } from '../../stream/Stream';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { IRawProperty } from '../property/IRawProperty';
import { readConfigureGlobal } from './configuration/GlobalParameters';
import { Parameters } from './configuration/Parameters';
import { QualifiedParameters } from './configuration/QualifiedParameters';
import { VerbosityLevel } from './configuration/VerbosityLevel';
import { decorateProperty } from './DecorateProperty';
import { RunDetails } from './reporter/RunDetails';
import { RunExecution } from './reporter/RunExecution';
import { RunnerIterator } from './RunnerIterator';
import { SourceValuesIterator } from './SourceValuesIterator';
import { toss } from './Tosser';
import { pathWalk } from './utils/PathWalker';
import { asyncReportRunDetails, reportRunDetails } from './utils/RunDetailsFormatter';
import { IAsyncProperty } from '../property/AsyncProperty';
import { IProperty } from '../property/Property';
import { INextRawProperty } from '../property/INextRawProperty';
import { NextValue } from '../arbitrary/definition/NextValue';
import { convertToNextProperty } from '../property/ConvertersProperty';

/** @internal */
function runIt<Ts>(
  property: INextRawProperty<Ts>,
  shrink: (value: NextValue<Ts>) => IterableIterator<NextValue<Ts>>,
  sourceValues: SourceValuesIterator<NextValue<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean
): RunExecution<Ts> {
  const runner = new RunnerIterator(sourceValues, shrink, verbose, interruptedAsFailure);
  for (const v of runner) {
    const out = property.run(v) as PreconditionFailure | string | null;
    runner.handleResult(out);
  }
  return runner.runExecution;
}

/** @internal */
async function asyncRunIt<Ts>(
  property: INextRawProperty<Ts>,
  shrink: (value: NextValue<Ts>) => IterableIterator<NextValue<Ts>>,
  sourceValues: SourceValuesIterator<NextValue<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean
): Promise<RunExecution<Ts>> {
  const runner = new RunnerIterator(sourceValues, shrink, verbose, interruptedAsFailure);
  for (const v of runner) {
    const out = await property.run(v);
    runner.handleResult(out);
  }
  return runner.runExecution;
}

/** @internal */
function runnerPathWalker<Ts>(
  valueProducers: IterableIterator<() => NextValue<Ts>>,
  shrink: (value: NextValue<Ts>) => Stream<NextValue<Ts>>,
  path: string
): Stream<() => NextValue<Ts>> {
  const pathPoints = path.split(':');
  const pathStream = stream(valueProducers)
    .drop(pathPoints.length > 0 ? +pathPoints[0] : 0)
    .map((producer) => producer());
  const adaptedPath = ['0', ...pathPoints.slice(1)].join(':');
  return stream(pathWalk(adaptedPath, pathStream, shrink)).map((v) => () => v);
}

/** @internal */
function buildInitialValues<Ts>(
  valueProducers: IterableIterator<() => NextValue<Ts>>,
  shrink: (value: NextValue<Ts>) => Stream<NextValue<Ts>>,
  qParams: QualifiedParameters<Ts>
): Stream<() => NextValue<Ts>> {
  if (qParams.path.length === 0) {
    return stream(valueProducers);
  }
  return runnerPathWalker(valueProducers, shrink, qParams.path);
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
  const qParams: QualifiedParameters<Ts> = QualifiedParameters.read<Ts>({
    ...(readConfigureGlobal() as Parameters<Ts>),
    ...params,
  });
  if (qParams.reporter !== null && qParams.asyncReporter !== null)
    throw new Error('Invalid parameters encountered, reporter and asyncReporter cannot be specified together');
  if (qParams.asyncReporter !== null && !rawProperty.isAsync())
    throw new Error('Invalid parameters encountered, only asyncProperty can be used when asyncReporter specified');
  const property = decorateProperty(rawProperty, qParams);
  const nextProperty = convertToNextProperty(property);
  const generator = toss(nextProperty, qParams.seed, qParams.randomType, qParams.examples);

  const maxInitialIterations = qParams.path.indexOf(':') === -1 ? qParams.numRuns : -1;
  const maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
  const shrink = nextProperty.shrink.bind(nextProperty);
  const initialValues = buildInitialValues(generator, shrink, qParams);
  const sourceValues = new SourceValuesIterator(initialValues, maxInitialIterations, maxSkips);
  const finalShrink = !qParams.endOnFailure ? shrink : Stream.nil;
  return nextProperty.isAsync()
    ? asyncRunIt(nextProperty, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).then((e) =>
        e.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams)
      )
    : runIt(nextProperty, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).toRunDetails(
        qParams.seed,
        qParams.path,
        maxSkips,
        qParams
      );
}

/**
 * Run the property, throw in case of failure
 *
 * It can be called directly from describe/it blocks of Mocha.
 * It does not return anything in case of success.
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
 * It does not return anything in case of success.
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
 * It does not return anything in case of success.
 *
 * WARNING: Has to be awaited if the property is asynchronous
 *
 * @param property - Property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @remarks Since 0.0.7
 * @public
 */
function assert<Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): Promise<void> | void;
function assert<Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): unknown {
  const out = check(property, params);
  if (property.isAsync()) return (out as Promise<RunDetails<Ts>>).then(asyncReportRunDetails);
  else reportRunDetails(out as RunDetails<Ts>);
}

export { check, assert };
