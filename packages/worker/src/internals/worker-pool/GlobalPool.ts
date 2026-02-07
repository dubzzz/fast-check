import { BasicPool } from './BasicPool.js';
import type { IWorkerPool, PooledWorker } from './IWorkerPool.js';

const poolPerFile = new Map<string, BasicPool<unknown, unknown>>();
const pendingTerminationPerFile = new Map<string, ReturnType<typeof setTimeout>>();

function cancelPendingTerminationIfAny(workerFileUrl: URL) {
  const key = workerFileUrl.toString();
  const pendingTermination = pendingTerminationPerFile.get(key);
  if (pendingTermination === undefined) {
    return;
  }
  clearTimeout(pendingTermination);
}

/**
 * Cross-properties pool able to re-use the workers for many properties
 */
export class GlobalPool<TSuccess, TPayload> implements IWorkerPool<TSuccess, TPayload> {
  private readonly internalPool: BasicPool<TSuccess, TPayload>;

  /**
   * Instantiate a new pool of workers
   * @param workerFileUrl - URL of the script for workers
   */
  constructor(private readonly workerFileUrl: URL) {
    const key = workerFileUrl.toString();
    const existingPool = poolPerFile.get(key);
    if (existingPool !== undefined) {
      this.internalPool = existingPool as BasicPool<TSuccess, TPayload>;
    } else {
      const freshPool = new BasicPool<TSuccess, TPayload>(workerFileUrl);
      this.internalPool = freshPool;
      poolPerFile.set(key, freshPool as BasicPool<unknown, unknown>);
    }
    cancelPendingTerminationIfAny(workerFileUrl);
  }

  spawnNewWorker(): Promise<PooledWorker<TSuccess, TPayload>> {
    cancelPendingTerminationIfAny(this.workerFileUrl);
    return this.internalPool.spawnNewWorker();
  }

  getFirstAvailableWorker(): PooledWorker<TSuccess, TPayload> | undefined {
    cancelPendingTerminationIfAny(this.workerFileUrl);
    return this.internalPool.getFirstAvailableWorker();
  }

  terminateAllWorkers(): Promise<void> {
    cancelPendingTerminationIfAny(this.workerFileUrl);
    pendingTerminationPerFile.set(
      this.workerFileUrl.toString(),
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.internalPool.terminateAllWorkers();
      }, 0),
    );
    return Promise.resolve();
  }
}
