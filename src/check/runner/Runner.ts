import { stream } from '../../stream/Stream';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { AsyncProperty } from '../property/AsyncProperty';
import { IProperty } from '../property/IProperty';
import { Property } from '../property/Property';
import { TimeoutProperty } from '../property/TimeoutProperty';
import { UnbiasedProperty } from '../property/UnbiasedProperty';
import { Parameters } from './configuration/Parameters';
import { QualifiedParameters } from './configuration/QualifiedParameters';
import { VerbosityLevel } from './configuration/VerbosityLevel';
import { RunDetails } from './reporter/RunDetails';
import { RunExecution } from './reporter/RunExecution';
import { SourceValuesIterator } from './SourceValuesIterator';
import { toss } from './Tosser';
import { pathWalk } from './utils/PathWalker';
import { throwIfFailed } from './utils/RunDetailsFormatter';

/** @hidden */
function runIt<Ts>(
  property: IProperty<Ts>,
  sourceValues: SourceValuesIterator<Shrinkable<Ts>>,
  verbose: VerbosityLevel
): RunExecution<Ts> {
  const runExecution = new RunExecution<Ts>(verbose);
  let done = false;
  let values: IterableIterator<Shrinkable<Ts>> = sourceValues;
  while (!done) {
    done = true;
    let idx = 0;
    for (const v of values) {
      const out = property.run(v.value_) as PreconditionFailure | string | null;
      if (out != null && typeof out === 'string') {
        runExecution.fail(v.value_, idx, out);
        values = v.shrink();
        done = false;
        break;
      }
      if (out != null) {
        // skipped the run
        runExecution.skip(v.value_);
        sourceValues.skippedOne();
      } else {
        runExecution.success(v.value_);
      }
      ++idx;
    }
  }
  return runExecution;
}

/** @hidden */
async function asyncRunIt<Ts>(
  property: IProperty<Ts>,
  sourceValues: SourceValuesIterator<Shrinkable<Ts>>,
  verbose: VerbosityLevel
): Promise<RunExecution<Ts>> {
  const runExecution = new RunExecution<Ts>(verbose);
  let done = false;
  let values: IterableIterator<Shrinkable<Ts>> = sourceValues;
  while (!done) {
    done = true;
    let idx = 0;
    for (const v of values) {
      const out = await property.run(v.value_);
      if (out != null && typeof out === 'string') {
        runExecution.fail(v.value_, idx, out);
        values = v.shrink();
        done = false;
        break;
      }
      if (out != null) {
        // skipped the run
        runExecution.skip(v.value_);
        sourceValues.skippedOne();
      } else {
        runExecution.success(v.value_);
      }
      ++idx;
    }
  }
  return runExecution;
}

/** @hidden */
function decorateProperty<Ts>(rawProperty: IProperty<Ts>, qParams: QualifiedParameters<Ts>) {
  const propA =
    rawProperty.isAsync() && qParams.timeout != null ? new TimeoutProperty(rawProperty, qParams.timeout) : rawProperty;
  return qParams.unbiased === true ? new UnbiasedProperty(propA) : propA;
}

/** @hidden */
function runnerPathWalker<Ts>(valueProducers: IterableIterator<() => Shrinkable<Ts>>, path: string) {
  const pathPoints = path.split(':');
  const pathStream = stream(valueProducers)
    .drop(pathPoints.length > 0 ? +pathPoints[0] : 0)
    .map(producer => producer());
  const adaptedPath = ['0', ...pathPoints.slice(1)].join(':');
  return stream(pathWalk(adaptedPath, pathStream)).map(v => () => v);
}

/** @hidden */
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
function check<Ts>(property: AsyncProperty<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>>;
/**
 * Run the property, do not throw contrary to {@link assert}
 *
 * @param property Synchronous property to be checked
 * @param params Optional parameters to customize the execution
 *
 * @returns Test status and other useful details
 */
function check<Ts>(property: Property<Ts>, params?: Parameters<Ts>): RunDetails<Ts>;
function check<Ts>(property: IProperty<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>> | RunDetails<Ts>;
function check<Ts>(rawProperty: IProperty<Ts>, params?: Parameters<Ts>) {
  if (rawProperty == null || rawProperty.generate == null)
    throw new Error('Invalid property encountered, please use a valid property');
  if (rawProperty.run == null)
    throw new Error('Invalid property encountered, please use a valid property not an arbitrary');
  const qParams = QualifiedParameters.read(params);
  const property = decorateProperty(rawProperty, qParams);
  const generator = toss(property, qParams.seed, qParams.randomType, qParams.examples);

  const maxInitialIterations = qParams.path.length === 0 ? qParams.numRuns : -1;
  const maxSkips = qParams.numRuns * qParams.maxSkipsPerRun;
  const initialValues = buildInitialValues(generator, qParams);
  const sourceValues = new SourceValuesIterator(initialValues, maxInitialIterations, maxSkips);
  return property.isAsync()
    ? asyncRunIt(property, sourceValues, qParams.verbose).then(e =>
        e.toRunDetails(qParams.seed, qParams.path, qParams.numRuns, maxSkips)
      )
    : runIt(property, sourceValues, qParams.verbose).toRunDetails(
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
function assert<Ts>(property: AsyncProperty<Ts>, params?: Parameters<Ts>): Promise<void>;
/**
 * Run the property, throw in case of failure
 *
 * It can be called directly from describe/it blocks of Mocha.
 * It does not return anything in case of success.
 *
 * @param property Synchronous property to be checked
 * @param params Optional parameters to customize the execution
 */
function assert<Ts>(property: Property<Ts>, params?: Parameters<Ts>): void;
function assert<Ts>(property: IProperty<Ts>, params?: Parameters<Ts>): Promise<void> | void;
function assert<Ts>(property: IProperty<Ts>, params?: Parameters<Ts>) {
  const out = check(property, params);
  if (property.isAsync()) return (out as Promise<RunDetails<Ts>>).then(throwIfFailed);
  else throwIfFailed(out as RunDetails<Ts>);
}

export { check, assert };
