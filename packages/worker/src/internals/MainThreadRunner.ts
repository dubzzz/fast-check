import fc from 'fast-check';
import { type PropertyArbitraries, type WorkerProperty } from './SharedTypes.js';
import { BasicPool, PooledWorker } from './worker-pool/BasicPool.js';
import { Lock } from './worker-pool/Lock.js';

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
  const lock = new Lock();
  const pool = new BasicPool<boolean | void, Ts>(workerFileUrl, workerId);

  let releaseLock: (() => void) | undefined = undefined;
  let worker: PooledWorker<boolean | void, Ts> | undefined = undefined;
  const property = fc.asyncProperty<Ts>(...arbitraries, async (...inputs) => {
    return new Promise((resolve, reject) => {
      if (worker === undefined) {
        reject(new Error('Badly initialized worker, unable to run the property'));
        return;
      }
      worker.register(inputs, resolve, reject);
    });
  });
  property.beforeEach(async (hookFunction) => {
    await hookFunction(); // run outside of the worker, can throw
    const acquired = await lock.acquire();
    releaseLock = acquired.release;
    worker = pool.getFirstAvailableWorker() || (await pool.spawnNewWorker()); // can throw
  });
  property.afterEach(async (hookFunction) => {
    if (worker !== undefined) {
      worker.terminateIfStillRunning().catch(() => void 0); // no need to wait for the termination
      worker = undefined;
    }
    if (releaseLock !== undefined) {
      releaseLock();
      releaseLock = undefined;
    }
    await hookFunction(); // run outside of the worker, can throw
  });
  const terminateAllWorkers = () => pool.terminateAllWorkers();
  return { property, terminateAllWorkers };
}
