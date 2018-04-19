import { Stream, stream } from '../../fast-check';
import Shrinkable from '../arbitrary/definition/Shrinkable';
import { AsyncProperty } from '../property/AsyncProperty';
import IProperty from '../property/IProperty';
import { Property } from '../property/Property';
import { TimeoutProperty } from '../property/TimeoutProperty';
import { toss } from './Tosser';
import { pathWalk } from './utils/PathWalker';
import { Parameters, QualifiedParameters, RunDetails, RunExecution, throwIfFailed } from './utils/utils';

function runIt<Ts>(property: IProperty<Ts>, initialValues: IterableIterator<Shrinkable<Ts>>): RunExecution<Ts> {
  const runExecution = new RunExecution<Ts>();
  let done = false;
  let values: IterableIterator<Shrinkable<Ts>> = initialValues;
  while (!done) {
    done = true;
    let idx = 0;
    for (const v of values) {
      const out = <string | null>property.run(v.value);
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
async function asyncRunIt<Ts>(
  property: IProperty<Ts>,
  initialValues: IterableIterator<Shrinkable<Ts>>
): Promise<RunExecution<Ts>> {
  const runExecution = new RunExecution<Ts>();
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

function check<Ts>(property: AsyncProperty<Ts>, params?: Parameters): Promise<RunDetails<Ts>>;
function check<Ts>(property: Property<Ts>, params?: Parameters): RunDetails<Ts>;
function check<Ts>(property: IProperty<Ts>, params?: Parameters): Promise<RunDetails<Ts>> | RunDetails<Ts>;
function check<Ts>(rawProperty: IProperty<Ts>, params?: Parameters) {
  if (rawProperty == null || rawProperty.generate == null)
    throw new Error('Invalid property encountered, please use a valid property');
  if (rawProperty.run == null)
    throw new Error('Invalid property encountered, please use a valid property not an arbitrary');
  const qParams = QualifiedParameters.read(params);
  const property =
    rawProperty.isAsync() && qParams.timeout != null ? new TimeoutProperty(rawProperty, qParams.timeout) : rawProperty;
  const generator = toss(property, qParams.seed);

  function* g() {
    for (let idx = 0; idx < qParams.num_runs; ++idx) yield generator.next().value();
  }
  const initialValues = qParams.path.length === 0 ? g() : pathWalk(qParams.path, g());
  return property.isAsync()
    ? asyncRunIt(property, initialValues).then(e => e.toRunDetails(qParams))
    : runIt(property, initialValues).toRunDetails(qParams);
}

function assert<Ts>(property: AsyncProperty<Ts>, params?: Parameters): Promise<void>;
function assert<Ts>(property: Property<Ts>, params?: Parameters): void;
function assert<Ts>(property: IProperty<Ts>, params?: Parameters): Promise<void> | void;
function assert<Ts>(property: IProperty<Ts>, params?: Parameters) {
  const out = check(property, params);
  if (property.isAsync()) return (<Promise<RunDetails<Ts>>>out).then(throwIfFailed);
  else throwIfFailed(<RunDetails<Ts>>out);
}

export { check, assert };
