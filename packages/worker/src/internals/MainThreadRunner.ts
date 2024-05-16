import type { PropertyArbitraries, WorkerProperty } from './SharedTypes.js';
import { BasicPool } from './worker-pool/BasicPool.js';
import { Lock } from './lock/Lock.js';
import type { IWorkerPool, Payload, PooledWorker } from './worker-pool/IWorkerPool.js';
import { OneTimePool } from './worker-pool/OneTimePool.js';
import { GlobalPool } from './worker-pool/GlobalPool.js';
import { buildWorkerProperty } from './worker-property/WorkerPropertyBuilder.js';
import { PreconditionFailure } from 'fast-check';

/**
 * Create a property able to run in the main thread and firing workers whenever required
 *
 * @param workerFileUrl - The URL towards the file holding the worker's code
 * @param predicateId - Id of the predicate
 * @param isolationLevel - The kind of isolation to be put in place between two executions of predicates
 * @param randomSource - Where should we generate the random values?
 * @param arbitraries - The arbitraries used to generate the inputs for the predicate hold within the worker
 */
export function runMainThread<Ts extends [unknown, ...unknown[]]>(
  workerFileUrl: URL,
  predicateId: number,
  isolationLevel: 'file' | 'property' | 'predicate',
  randomSource: 'main-thread' | 'worker',
  arbitraries: PropertyArbitraries<Ts>,
): { property: WorkerProperty<Ts>; terminateAllWorkers: () => Promise<void> } {
  const lock = new Lock();
  const pool: IWorkerPool<boolean | void, Payload<Ts>> = isolationLevel === 'predicate'
    ? new OneTimePool(workerFileUrl)
    : isolationLevel === 'property'
      ? new BasicPool(workerFileUrl)
      : new GlobalPool(workerFileUrl);

  let releaseLock: (() => void) | undefined = undefined;
  let worker: PooledWorker<boolean | void, Payload<Ts>> | undefined = undefined;
  const property = buildWorkerProperty(
    arbitraries,
    async (...inputs) => {
      return new Promise((resolve, reject) => {
        if (worker === undefined) {
          reject(new Error('Badly initialized worker, unable to run the property'));
          return;
        }
        worker.register(predicateId, property.getPayload(inputs), resolve, reject, () =>
          reject(new PreconditionFailure()),
        );
      });
    },
    randomSource === 'worker',
  );
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
