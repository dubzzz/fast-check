import { BasicPool, OnErrorCallback, OnSuccessCallback } from './BasicPool';

/**
 * Advanced pool for workers
 */
export class WorkerPool<TSuccess, TPayload> {
  private readonly pool: BasicPool<TSuccess, TPayload>;

  constructor(workerFileUrl: URL, workerId: number) {
    this.pool = new BasicPool<TSuccess, TPayload>(workerFileUrl, workerId);
  }

  /** Take one worker from the pool if any is available to handle queries or spawn a new one */
  public async acquireOne(
    payload: TPayload,
    onSuccess: OnSuccessCallback<TSuccess>,
    onFailure: OnErrorCallback
  ): Promise<void> {
    const worker = this.pool.getFirstAvailableWorker() || (await this.pool.spawnNewWorker());
    return worker.register(payload, onSuccess, onFailure);
  }

  /** Terminate any spawned worker */
  public terminateAllWorkers(): Promise<void> {
    return this.pool.terminateAllWorkers();
  }
}
