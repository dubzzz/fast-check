import { isMainThread, parentPort, workerData } from 'node:worker_threads';

import { assert as fcAssert, type IAsyncProperty, type IProperty, type Parameters } from 'fast-check';
import { runWorker } from './internals/worker-runner/WorkerRunner.js';
import { runMainThread } from './internals/MainThreadRunner.js';
import { NoopWorkerProperty } from './internals/NoopWorkerProperty.js';
import type { PropertyArbitraries, PropertyPredicate, WorkerProperty } from './internals/SharedTypes.js';
import { runNoWorker } from './internals/worker-runner/NoWorkerRunner.js';

let lastPredicateId = 0;
const allKnownTerminateAllWorkersPerProperty = new Map<
  IAsyncProperty<unknown> | IProperty<unknown>,
  () => Promise<void>
>();
async function clearAllWorkersFor(property: IAsyncProperty<unknown> | IProperty<unknown>): Promise<void> {
  const terminateAllWorkers = allKnownTerminateAllWorkersPerProperty.get(property);
  if (terminateAllWorkers === undefined) {
    return;
  }
  await terminateAllWorkers();
}

/**
 * Run the property, throw in case of failure.
 *
 * Key differences from the assert function defined within fast-check itself:
 * - it is asynchronous
 * - it automatically kills all workers linked to the property on exit
 * - it does not execute itself in a worker mode
 *
 * It can be called directly from describe/it blocks of Mocha. No meaningful results are produced in case of success.
 *
 * @param property — Synchronous or asynchronous property to be checked
 * @param params — Optional parameters to customize the execution
 * @public
 */
export async function assert<Ts>(property: IAsyncProperty<Ts> | IProperty<Ts>, params?: Parameters<Ts>): Promise<void> {
  if (isMainThread) {
    // Main thread code
    try {
      await fcAssert(property, params);
    } finally {
      await clearAllWorkersFor(property);
    }
  } else {
    // Worker code
    return;
  }
}

/**
 * Set of options to configure our worker-based properties
 * @public
 */
export type PropertyForOptions = {
  /**
   * How to isolate executions of the predicates from each others?
   * The more isolated they are the less risk if one execution alter shared globals, but the more time it takes.
   *
   * - `file`: Re-use workers cross properties
   * - `property`: Re-use workers for each run of the predicate. Not shared across properties!
   * - `predicate`: One worker per run of the predicate
   *
   * @default "file"
   */
  isolationLevel?: 'file' | 'property' | 'predicate';
};

const registeredPredicates = new Set<number>();
if (!isMainThread && parentPort !== null && workerData.fastcheckWorker === true) {
  runNoWorker(parentPort, registeredPredicates);
}

function workerProperty<Ts extends [unknown, ...unknown[]]>(
  url: URL,
  options: PropertyForOptions,
  ...args: [...arbitraries: PropertyArbitraries<Ts>, predicate: PropertyPredicate<Ts>]
): WorkerProperty<Ts> {
  const currentPredicateId = ++lastPredicateId;
  if (isMainThread) {
    // Main thread code
    const isolationLevel = options.isolationLevel || 'file';
    const arbitraries = args.slice(0, -1) as PropertyArbitraries<Ts>;
    const { property, terminateAllWorkers } = runMainThread<Ts>(url, currentPredicateId, isolationLevel, arbitraries);
    allKnownTerminateAllWorkersPerProperty.set(property, terminateAllWorkers);
    return property;
  } else if (parentPort !== null && workerData.fastcheckWorker === true) {
    // Worker code
    const predicate = args[args.length - 1] as PropertyPredicate<Ts>;
    runWorker(parentPort, currentPredicateId, predicate);
    registeredPredicates.add(currentPredicateId);
  }
  // Cannot throw for invalid worker at this point as we may not be the only worker for this run
  // so we just return a dummy no-op property
  return new NoopWorkerProperty<Ts>();
}

/**
 * Create a builder for async properties backed by workers.
 * The output of this function can be used as `fc.property` or `fc.asyncProperty` except it must be executed by the `assert` of this package.
 *
 * The properties build from this builder will ALWAYS run predicates in another worker and not within the main thread which will only deal
 * with the generation of the random values and orchestration.
 *
 * For the moment such properties MUST explicitely be executed from the `assert` helper function of this package.
 * Otherwise workers will stay forever.
 *
 *
 * @param url - URL towards the worker file: usually `pathToFileURL(__filename)` for commonjs and `new URL(import.meta.url)` for es modules
 * @param options - Set of options to configure our worker-based properties
 * @public
 */
export function propertyFor(
  url: URL,
  options?: PropertyForOptions,
): <Ts extends [unknown, ...unknown[]]>(
  ...args: [...arbitraries: PropertyArbitraries<Ts>, predicate: PropertyPredicate<Ts>]
) => WorkerProperty<Ts> {
  return function property<Ts extends [unknown, ...unknown[]]>(
    ...args: [...arbitraries: PropertyArbitraries<Ts>, predicate: PropertyPredicate<Ts>]
  ): WorkerProperty<Ts> {
    return workerProperty(url, options || {}, ...args);
  };
}
