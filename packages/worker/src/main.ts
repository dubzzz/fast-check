import { isMainThread, parentPort, workerData } from 'node:worker_threads';

import { runWorker } from './internals/WorkerRunner';
import { runMainThread } from './internals/MainThreadRunner';
import { NoopWorkerProperty } from './internals/NoopWorkerProperty';
import { type PropertyArbitraries, type PropertyPredicate, type WorkerProperty } from './internals/SharedTypes';

let lastWorkerId = 0;
export function workerProperty<Ts extends [unknown, ...unknown[]]>(
  url: URL,
  ...args: [...arbitraries: PropertyArbitraries<Ts>, predicate: PropertyPredicate<Ts>]
): WorkerProperty<Ts> {
  const currentWorkerId = ++lastWorkerId;
  if (isMainThread) {
    // Main thread code
    const arbitraries = args.slice(0, -1) as PropertyArbitraries<Ts>;
    return runMainThread<Ts>(url, arbitraries);
  } else if (parentPort !== null && currentWorkerId === workerData.currentWorkerId) {
    // Worker code
    const predicate = args[args.length - 1] as PropertyPredicate<Ts>;
    runWorker(parentPort, predicate);
  }
  // Cannot throw for invalid worker at this point as we may not be the only worker for this run
  // so we just return a dummy no-op property
  return new NoopWorkerProperty<Ts>();
}
