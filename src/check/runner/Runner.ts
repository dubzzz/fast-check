import Shrinkable from '../arbitrary/definition/Shrinkable';
import { AsyncProperty } from '../property/AsyncProperty';
import IProperty from '../property/IProperty';
import { Property } from '../property/Property';
import { TimeoutProperty } from '../property/TimeoutProperty';
import { UnbiasedProperty } from '../property/UnbiasedProperty';
import { Parameters } from './configuration/Parameters';
import { QualifiedParameters } from './configuration/QualifiedParameters';
import { RunDetails } from './reporter/RunDetails';
import { RunExecution } from './reporter/RunExecution';
import { toss } from './Tosser';
import { pathWalk } from './utils/PathWalker';
import { throwIfFailed } from './utils/utils';

/** @hidden */
function runIt<Ts>(
  property: IProperty<Ts>,
  initialValues: IterableIterator<Shrinkable<Ts>>,
  verbose: boolean
): RunExecution<Ts> {
  const runExecution = new RunExecution<Ts>(verbose);
  let done = false;
  let values: IterableIterator<Shrinkable<Ts>> = initialValues;
  while (!done) {
    done = true;
    let idx = 0;
    for (const v of values) {
      const out = property.run(v.value) as string | null;
      if (out != null) {
        runExecution.fail(v.value, idx, out);
        values = v.shrink();
        done = false;
        break;
      }
      ++idx;
    }
  }
  return runExecution;
}

/** @hidden */
async function asyncRunIt<Ts>(
  property: IProperty<Ts>,
  initialValues: IterableIterator<Shrinkable<Ts>>,
  verbose: boolean
): Promise<RunExecution<Ts>> {
  const runExecution = new RunExecution<Ts>(verbose);
  let done = false;
  let values: IterableIterator<Shrinkable<Ts>> = initialValues;
  while (!done) {
    done = true;
    let idx = 0;
    for (const v of values) {
      const out = await property.run(v.value);
      if (out != null) {
        runExecution.fail(v.value, idx, out);
        values = v.shrink();
        done = false;
        break;
      }
      ++idx;
    }
  }
  return runExecution;
}

/** @hidden */
function decorateProperty<Ts>(rawProperty: IProperty<Ts>, qParams: QualifiedParameters) {
  const propA =
    rawProperty.isAsync() && qParams.timeout != null ? new TimeoutProperty(rawProperty, qParams.timeout) : rawProperty;
  return qParams.unbiased === true ? new UnbiasedProperty(propA) : propA;
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
function check<Ts>(property: AsyncProperty<Ts>, params?: Parameters): Promise<RunDetails<Ts>>;
/**
 * Run the property, do not throw contrary to {@link assert}
 *
 * @param property Synchronous property to be checked
 * @param params Optional parameters to customize the execution
 *
 * @returns Test status and other useful details
 */
function check<Ts>(property: Property<Ts>, params?: Parameters): RunDetails<Ts>;
function check<Ts>(property: IProperty<Ts>, params?: Parameters): Promise<RunDetails<Ts>> | RunDetails<Ts>;
function check<Ts>(rawProperty: IProperty<Ts>, params?: Parameters) {
  if (rawProperty == null || rawProperty.generate == null)
    throw new Error('Invalid property encountered, please use a valid property');
  if (rawProperty.run == null)
    throw new Error('Invalid property encountered, please use a valid property not an arbitrary');
  const qParams = QualifiedParameters.read(params);
  const property = decorateProperty(rawProperty, qParams);
  const generator = toss(property, qParams.seed);

  function* g() {
    for (let idx = 0; idx < qParams.numRuns; ++idx) yield generator.next().value();
  }
  const initialValues = qParams.path.length === 0 ? g() : pathWalk(qParams.path, g());
  return property.isAsync()
    ? asyncRunIt(property, initialValues, qParams.verbose).then(e =>
        e.toRunDetails(qParams.seed, qParams.path, qParams.numRuns)
      )
    : runIt(property, initialValues, qParams.verbose).toRunDetails(qParams.seed, qParams.path, qParams.numRuns);
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
function assert<Ts>(property: AsyncProperty<Ts>, params?: Parameters): Promise<void>;
/**
 * Run the property, throw in case of failure
 *
 * It can be called directly from describe/it blocks of Mocha.
 * It does not return anything in case of success.
 *
 * @param property Synchronous property to be checked
 * @param params Optional parameters to customize the execution
 */
function assert<Ts>(property: Property<Ts>, params?: Parameters): void;
function assert<Ts>(property: IProperty<Ts>, params?: Parameters): Promise<void> | void;
function assert<Ts>(property: IProperty<Ts>, params?: Parameters) {
  const out = check(property, params);
  if (property.isAsync()) return (out as Promise<RunDetails<Ts>>).then(throwIfFailed);
  else throwIfFailed(out as RunDetails<Ts>);
}

export { check, assert };
