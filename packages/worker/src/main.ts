import { isMainThread, parentPort, workerData, Worker } from 'node:worker_threads';

import { runWorker } from './internals/WorkerRunner.js';
import { runMainThread } from './internals/MainThreadRunner.js';
import { NoopWorkerProperty } from './internals/NoopWorkerProperty.js';
import { type PropertyArbitraries, type PropertyPredicate, type WorkerProperty } from './internals/SharedTypes.js';

let lastWorkerId = 0;
const allKnownWorkersPerProperty = new Map<WorkerProperty<unknown>, Worker[]>();

export function workerProperty<Ts extends [unknown, ...unknown[]]>(
  url: URL,
  ...args: [...arbitraries: PropertyArbitraries<Ts>, predicate: PropertyPredicate<Ts>]
): WorkerProperty<Ts> {
  const currentWorkerId = ++lastWorkerId;
  if (isMainThread) {
    // Main thread code
    const arbitraries = args.slice(0, -1) as PropertyArbitraries<Ts>;
    const property = runMainThread<Ts>(url, currentWorkerId, arbitraries, (worker) => {
      const workers = allKnownWorkersPerProperty.get(property);
      if (workers === undefined) {
        allKnownWorkersPerProperty.set(property, [worker]);
      } else {
        workers.push(worker);
      }
    });
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

export function clearAllWorkersFor(property: WorkerProperty<unknown>): void {
  const workers = allKnownWorkersPerProperty.get(property);
  if (workers === undefined) {
    return;
  }
  workers.forEach((worker) => worker.terminate());
  allKnownWorkersPerProperty.delete(property);
}
