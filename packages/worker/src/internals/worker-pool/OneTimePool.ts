import { BasicPool } from './BasicPool';
import { IWorkerPool, PooledWorker } from './IWorkerPool';

/**
 * Pool never re-using already spawned worker.
 * Worker can only be used once.
 */
export class OneTimePool<TSuccess, TPayload> implements IWorkerPool<TSuccess, TPayload> {
  private readonly internalPool: BasicPool<TSuccess, TPayload>;

  /**
   * Instantiate a new pool of workers
   * @param workerFileUrl - URL of the script for workers
   * @param workerId - Id of the worker to be passed to the worker at launch time
   */
  constructor(workerFileUrl: URL, workerId: number) {
    this.internalPool = new BasicPool<TSuccess, TPayload>(workerFileUrl, workerId);
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
