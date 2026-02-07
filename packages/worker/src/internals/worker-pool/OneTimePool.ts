import { BasicPool } from './BasicPool.js';
import type { IWorkerPool, PooledWorker } from './IWorkerPool.js';

/**
 * Pool never re-using already spawned worker.
 * Worker can only be used once.
 */
export class OneTimePool<TSuccess, TPayload> implements IWorkerPool<TSuccess, TPayload> {
  private readonly internalPool: BasicPool<TSuccess, TPayload>;

  /**
   * Instantiate a new pool of workers
   * @param workerFileUrl - URL of the script for workers
   */
  constructor(workerFileUrl: URL) {
    this.internalPool = new BasicPool<TSuccess, TPayload>(workerFileUrl);
  }

  spawnNewWorker(): Promise<PooledWorker<TSuccess, TPayload>> {
    return this.internalPool.spawnNewWorker();
  }

  getFirstAvailableWorker(): PooledWorker<TSuccess, TPayload> | undefined {
    return undefined;
  }

  terminateAllWorkers(): Promise<void> {
    return this.internalPool.terminateAllWorkers();
  }
}
