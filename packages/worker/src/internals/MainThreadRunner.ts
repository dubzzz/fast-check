import fc from 'fast-check';
import { type PropertyArbitraries, type WorkerProperty } from './SharedTypes.js';
import { WorkerPool } from './worker-pool/WorkerPool.js';

/**
 * Create a property able to run in the main thread and firing workers whenever required
 *
 * @param workerFileUrl - The URL towards the file holding the worker's code
 * @param workerId - Id of the worker
 * @param arbitraries - The arbitraries used to generate the inputs for the predicate hold within the worker
 * @param onNewWorker - Callback function to be called whenever a new worker gets created
 */
export function runMainThread<Ts extends [unknown, ...unknown[]]>(
  workerFileUrl: URL,
  workerId: number,
  arbitraries: PropertyArbitraries<Ts>
): { property: WorkerProperty<Ts>; terminateAllWorkers: () => Promise<void> } {
  const pool = new WorkerPool<boolean | void, Ts>(workerFileUrl, workerId);
  const property = fc.asyncProperty<Ts>(...arbitraries, async (...inputs) => {
    return new Promise((resolve, reject) => {
      // TODO - Move acquire phase into some kind of beforeEach not to run it with the predicate
      pool.acquireOne(inputs, resolve, reject).catch(reject);
    });
  });
  const terminateAllWorkers = () => pool.terminateAllWorkers();
  return { property, terminateAllWorkers };
}
