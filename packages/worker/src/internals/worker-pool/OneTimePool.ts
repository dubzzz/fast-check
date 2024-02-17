import { writeFileSync } from 'fs';
import * as process from 'process';
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
    writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] OneTimePool::spawnNewWorker\n`, { flag: 'a' });
    return this.internalPool.spawnNewWorker();
  }

  getFirstAvailableWorker(): PooledWorker<TSuccess, TPayload> | undefined {
    return undefined;
  }

  terminateAllWorkers(): Promise<void> {
    writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] OneTimePool::terminateAllWorkers -> START\n`, {
      flag: 'a',
    });
    const p = this.internalPool.terminateAllWorkers();
    writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] OneTimePool::terminateAllWorkers -> END\n`, {
      flag: 'a',
    });
    return p;
  }
}
