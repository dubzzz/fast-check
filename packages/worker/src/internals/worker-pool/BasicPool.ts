import { Worker } from 'node:worker_threads';

export type OnSuccessCallback<TSuccess> = (value: TSuccess) => void;
export type OnErrorCallback = (error: unknown) => void;

/**
 * Worker API
 */
type PooledWorker<TSuccess, TPayload> = {
  isAvailable: () => boolean;
  isFaulty: () => boolean;
  register: (payload: TPayload, onSuccess: OnSuccessCallback<TSuccess>, onFailure: OnErrorCallback) => void;
};

/**
 * Worker internal API
 */
type InternalPooledWorker<TSuccess, TPayload> = PooledWorker<TSuccess, TPayload> & {
  worker: Worker;
};

/**
 * Message exchanged from the pool to the worker
 */
export type PoolToWorkerMessage<TPayload> = { runId: number; payload: TPayload };

/**
 * Message exchanged from the worker to the pool
 */
export type WorkerToPoolMessage<TSuccess> = { runId: number } & (
  | { success: true; output: TSuccess }
  | { success: false; error: unknown }
);

/**
 * Basic pool for workers, providing the ability to spawn new workers,
 * get the first available one and terminate them all
 */
export class BasicPool<TSuccess, TPayload> {
  private readonly workers: InternalPooledWorker<TSuccess, TPayload>[] = [];

  /**
   * Instantiate a new pool of workers
   * @param workerFileUrl - URL of the script for workers
   * @param workerId - Id of the worker to be passed to the worker at launch time
   */
  constructor(private readonly workerFileUrl: URL, private readonly workerId: number) {}

  /**
   * Spawn a new instance of worker ready to handle new tasks
   */
  public spawnNewWorker(): PooledWorker<TSuccess, TPayload> {
    let runIdInWorker = -1;
    let faulty = false;
    let registration: {
      currentRunId: number;
      onSuccess: OnSuccessCallback<TSuccess>;
      onFailure: OnErrorCallback;
    } | null = null;
    const worker = new Worker(this.workerFileUrl, { workerData: { currentWorkerId: this.workerId } });

    worker.on('message', (data: WorkerToPoolMessage<TSuccess>): void => {
      if (registration === null || data.runId !== registration.currentRunId) {
        return;
      }
      if (data.success) {
        registration.onSuccess(data.output);
      } else {
        registration.onFailure(data.error);
      }
      registration = null;
    });

    worker.on('error', (err): void => {
      faulty = true;
      if (registration !== null) {
        registration.onFailure(err);
      }
    });

    worker.on('exit', (code): void => {
      faulty = true;
      if (registration !== null) {
        registration.onFailure(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    const isFaulty = () => faulty;
    const isAvailable = () => !isFaulty() && registration === null;

    const pooledWorker: InternalPooledWorker<TSuccess, TPayload> = {
      worker,
      isAvailable,
      isFaulty,
      register: (payload, onSuccess, onFailure) => {
        if (!isAvailable()) {
          throw new Error('This instance of PooledWorker is currently in use');
        }
        const currentRunId = ++runIdInWorker;
        registration = { currentRunId, onSuccess, onFailure };
        const message: PoolToWorkerMessage<TPayload> = { payload, runId: currentRunId };
        worker.postMessage(message);
      },
    };
    this.workers.push(pooledWorker);
    return pooledWorker;
  }

  /**
   * Get the first available worker of the pool if any
   */
  public getFirstAvailableWorker(): PooledWorker<TSuccess, TPayload> | undefined {
    return this.workers.find((w) => w.isAvailable());
  }

  /**
   * Terminate all registered workers and drop them definitely for the pool
   */
  public terminateAllWorkers(): Promise<void> {
    const dropped = this.workers.splice(0, this.workers.length); // clear all workers
    return Promise.all(dropped.map((w) => w.worker.terminate())).then(() => undefined);
  }
}
