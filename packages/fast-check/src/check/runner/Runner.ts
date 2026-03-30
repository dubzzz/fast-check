import { Stream, stream } from '../../stream/Stream.js';
import type { IRawProperty } from '../property/IRawProperty.js';
import { readConfigureGlobal } from './configuration/GlobalParameters.js';
import type { Parameters } from './configuration/Parameters.js';
import { QualifiedParameters } from './configuration/QualifiedParameters.js';
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
    runner.handleResult(out);
  }
  return runner.runExecution;
}

/**
 * Run the property, do not throw contrary to {@link assert}
 *
 * WARNING: Has to be awaited
 *
 * @param property - Property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @returns Test status and other useful details
 *
 * @remarks Since 0.0.7
 * @public
 */
async function check<Ts>(rawProperty: IRawProperty<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>> {
  if (
    rawProperty === null ||
    rawProperty === undefined ||
    rawProperty.generate === null ||
    rawProperty.generate === undefined
  )
    throw new Error('Invalid property encountered, please use a valid property');
  if (rawProperty.run === null || rawProperty.run === undefined)
    throw new Error('Invalid property encountered, please use a valid property not an arbitrary');
  const qParams: QualifiedParameters<Ts> = QualifiedParameters.read<Ts>({
    ...(readConfigureGlobal() as Parameters<Ts>),
    ...params,
  });
  if (qParams.reporter !== undefined && qParams.asyncReporter !== undefined)
    throw new Error('Invalid parameters encountered, reporter and asyncReporter cannot be specified together');
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
  return asyncRunIt(property, finalShrink, sourceValues, qParams.verbose, qParams.markInterruptAsFailure).then((e) =>
    e.toRunDetails(qParams.seed, qParams.path, maxSkips, qParams),
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
 * @param property - Property to be checked
 * @param params - Optional parameters to customize the execution
 *
 * @remarks Since 0.0.7
 * @public
 */
async function assert<Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): Promise<void> {
  const out = await check(property, params);
  await asyncReportRunDetails(out);
}

export { check, assert };
