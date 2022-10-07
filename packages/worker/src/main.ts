import { isMainThread, parentPort, workerData } from 'node:worker_threads';

import { assert as fcAssert, type IAsyncProperty, type IProperty, type Parameters } from 'fast-check';
import { runWorker } from './internals/WorkerRunner.js';
import { runMainThread } from './internals/MainThreadRunner.js';
import { NoopWorkerProperty } from './internals/NoopWorkerProperty.js';
import { type PropertyArbitraries, type PropertyPredicate, type WorkerProperty } from './internals/SharedTypes.js';

let lastWorkerId = 0;
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
 * Create an async property backed by workers.
 * The predicate will ALWAYS run in another worker and not within the main thread which will only deal with the generation of the random values and orchestration.
 *
 * For the moment such property MUST explicitely be executed from the `assert` helper function of this package.
 * Otherwise workers will stay forever.
 *
 * @param url - URL towards the worker file: usually `pathToFileURL(__filename)` for commonjs and `new URL(import.meta.url)` for es modules
 * @param args - Arbitraries and predicate
 * @public
 */
export function workerProperty<Ts extends [unknown, ...unknown[]]>(
  url: URL,
  ...args: [...arbitraries: PropertyArbitraries<Ts>, predicate: PropertyPredicate<Ts>]
): WorkerProperty<Ts> {
  const currentWorkerId = ++lastWorkerId;
  if (isMainThread) {
    // Main thread code
    const arbitraries = args.slice(0, -1) as PropertyArbitraries<Ts>;
    const { property, terminateAllWorkers } = runMainThread<Ts>(url, currentWorkerId, arbitraries);
    allKnownTerminateAllWorkersPerProperty.set(property, terminateAllWorkers);
    return property;
  } else if (parentPort !== null && currentWorkerId === workerData.currentWorkerId) {
    // Worker code
    const predicate = args[args.length - 1] as PropertyPredicate<Ts>;
    runWorker(parentPort, predicate);
  }
  // Cannot throw for invalid worker at this point as we may not be the only worker for this run
  // so we just return a dummy no-op property
  return new NoopWorkerProperty<Ts>();
}
