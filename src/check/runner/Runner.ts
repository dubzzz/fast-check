import { stream } from '../../stream/Stream';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
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
import { throwIfFailed } from './utils/RunDetailsFormatter';
import { IAsyncProperty } from '../property/AsyncProperty';
import { IProperty } from '../property/Property';

/** @internal */
function runIt<Ts>(
  property: IRawProperty<Ts>,
  sourceValues: SourceValuesIterator<Shrinkable<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean
): RunExecution<Ts> {
  const runner = new RunnerIterator(sourceValues, verbose, interruptedAsFailure);
  for (const v of runner) {
    const out = property.run(v) as PreconditionFailure | string | null;
    runner.handleResult(out);
  }
  return runner.runExecution;
}

/** @internal */
async function asyncRunIt<Ts>(
  property: IRawProperty<Ts>,
  sourceValues: SourceValuesIterator<Shrinkable<Ts>>,
  verbose: VerbosityLevel,
  interruptedAsFailure: boolean
): Promise<RunExecution<Ts>> {
  const runner = new RunnerIterator(sourceValues, verbose, interruptedAsFailure);
  for (const v of runner) {
    const out = await property.run(v);
    runner.handleResult(out);
  }
  return runner.runExecution;
}

/** @internal */
function runnerPathWalker<Ts>(valueProducers: IterableIterator<() => Shrinkable<Ts>>, path: string) {
  const pathPoints = path.split(':');
  const pathStream = stream(valueProducers)
    .drop(pathPoints.length > 0 ? +pathPoints[0] : 0)
    .map(producer => producer());
  const adaptedPath = ['0', ...pathPoints.slice(1)].join(':');
  return stream(pathWalk(adaptedPath, pathStream)).map(v => () => v);
}

/** @internal */
function buildInitialValues<Ts>(
  valueProducers: IterableIterator<() => Shrinkable<Ts>>,
  qParams: QualifiedParameters<Ts>
) {
  const rawValues = qParams.path.length === 0 ? stream(valueProducers) : runnerPathWalker(valueProducers, qParams.path);
  if (!qParams.endOnFailure) return rawValues;
  // Disable shrinking capabilities
  return rawValues.map(shrinkableGen => {
    return () => {
      const s = shrinkableGen();
      return new Shrinkable(s.value_);
    };
  });
}

/**
 * Run the property, do not throw contrary to {@link assert}
 *
 * WARNING: Has to be awaited
 *
 * @param property Asynchronous property to be checked
 * @param params Optional parameters to customize the execution
 *
 * @returns Test status and other useful details
 */
function check<Ts>(property: IAsyncProperty<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>>;
/**
 * Run the property, do not throw contrary to {@link assert}
 *
 * @param property Synchronous property to be checked
 * @param params Optional parameters to customize the execution
 *
 * @returns Test status and other useful details
 */
function check<Ts>(property: IProperty<Ts>, params?: Parameters<Ts>): RunDetails<Ts>;
function check<Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>> | RunDetails<Ts>;
function check<Ts>(rawProperty: IRawProperty<Ts>, params?: Parameters<Ts>) {
  if (rawProperty == null || rawProperty.generate == null)
    throw new Error('Invalid property encountered, please use a valid property');
  if (rawProperty.run == null)
    throw new Error('Invalid property encountered, please use a valid property not an arbitrary');
  const qParams = QualifiedParameters.read({ ...readConfigureGlobal(), ...params });
  const property = decorateProperty(rawProperty, qParams);
  const generator = toss(property, qParams.seed, qParams.randomType, qParams.examples);

  const maxInitialIterations = qParams.path.indexOf(':') === -1 ? qParams.numRuns : -1;
  const maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
  const initialValues = buildInitialValues(generator, qParams);
  const sourceValues = new SourceValuesIterator(initialValues, maxInitialIterations, maxSkips);
  return property.isAsync()
    ? asyncRunIt(property, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).then(e =>
        e.toRunDetails(qParams.seed, qParams.path, qParams.numRuns, maxSkips)
      )
    : runIt(property, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).toRunDetails(
        qParams.seed,
        qParams.path,
        qParams.numRuns,
        maxSkips
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
 * @param property Asynchronous property to be checked
 * @param params Optional parameters to customize the execution
 */
function assert<Ts>(property: IAsyncProperty<Ts>, params?: Parameters<Ts>): Promise<void>;
/**
 * Run the property, throw in case of failure
 *
 * It can be called directly from describe/it blocks of Mocha.
 * It does not return anything in case of success.
 *
 * @param property Synchronous property to be checked
 * @param params Optional parameters to customize the execution
 */
function assert<Ts>(property: IProperty<Ts>, params?: Parameters<Ts>): void;
function assert<Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): Promise<void> | void;
function assert<Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>) {
  const out = check(property, params);
  if (property.isAsync()) return (out as Promise<RunDetails<Ts>>).then(throwIfFailed);
  else throwIfFailed(out as RunDetails<Ts>);
}

export { check, assert };
