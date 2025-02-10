import { Worker } from 'node:worker_threads';
import {
  type OnErrorCallback,
  type OnSuccessCallback,
  type OnSkippedCallback,
  type IWorkerPool,
  type PooledWorker,
  type WorkerToPoolMessage,
  type PoolToWorkerMessage,
  WorkerToPoolMessageStatus,
} from './IWorkerPool.js';

/**
 * Worker internal API
 */
type InternalPooledWorker<TSuccess, TPayload> = PooledWorker<TSuccess, TPayload> & {
  worker: Worker;
};

/**
 * Basic pool for workers, providing the ability to spawn new workers,
 * get the first available one and terminate them all
 */
export class BasicPool<TSuccess, TPayload> implements IWorkerPool<TSuccess, TPayload> {
  private readonly workers: InternalPooledWorker<TSuccess, TPayload>[] = [];

  /**
   * Instantiate a new pool of workers
   * @param workerFileUrl - URL of the script for workers
   */
  constructor(private readonly workerFileUrl: URL) {}

  public async spawnNewWorker(): Promise<PooledWorker<TSuccess, TPayload>> {
    let runIdInWorker = -1;
    let ready = false;
    let faulty = false;
    let registration: {
      currentRunId: number;
      onSuccess: OnSuccessCallback<TSuccess>;
      onFailure: OnErrorCallback;
      onSkipped: OnSkippedCallback;
    } | null = null;
    const worker = new Worker(this.workerFileUrl, { workerData: { fastcheckWorker: true } });

    let resolveOnline: () => void = () => undefined;
    let rejectOnline: (error: unknown) => void = () => undefined;
    const waitOnline = new Promise<void>((resolve, reject) => {
      resolveOnline = resolve;
      rejectOnline = reject;
    });

    worker.on('online', () => {
      // Emitted when the worker thread has started executing JavaScript code.
      // More details at https://nodejs.org/api/worker_threads.html#event-online
      ready = true;
      resolveOnline();
    });

    worker.on('message', (data: WorkerToPoolMessage<TSuccess>): void => {
      // Emitted for any incoming message, containing the cloned input of port.postMessage().
      // More details at https://nodejs.org/api/worker_threads.html#event-message
      if (registration === null || data.runId !== registration.currentRunId) {
        return;
      }
      if (data.status === WorkerToPoolMessageStatus.Success) {
        registration.onSuccess(data.output);
      } else if (data.status === WorkerToPoolMessageStatus.Failure) {
        registration.onFailure(data.error);
      } else {
        registration.onSkipped();
      }
      registration = null;
    });

    worker.on('messageerror', (err: Error): void => {
      // Emitted when deserializing a message failed.
      // More details at https://nodejs.org/api/worker_threads.html#event-messageerror
      if (!ready) {
        faulty = true; // we don't really expect such message while not ready
        rejectOnline(err);
      }
      if (registration !== null) {
        registration.onFailure(err);
      }
      registration = null;
    });

    worker.on('error', (err: Error): void => {
      // Emitted if the worker thread throws an uncaught exception. In that case, the worker is terminated.
      // More details at https://nodejs.org/api/worker_threads.html#event-error
      faulty = true;
      if (!ready) {
        rejectOnline(err);
      }
      if (registration !== null) {
        registration.onFailure(err);
      }
      registration = null;
    });

    worker.on('exit', (code: number): void => {
      // Emitted once the worker has stopped. If the worker exited by calling process.exit(), the exitCode parameter is the passed exit code. If the worker was terminated, the exitCode parameter is 1.
      // More details at https://nodejs.org/api/worker_threads.html#event-exit
      faulty = true;
      const err = new Error(`Worker stopped with exit code ${code}`);
      if (!ready) {
        rejectOnline(err);
      }
      if (registration !== null) {
        registration.onFailure(err);
      }
      registration = null;
    });

    const isFaulty = () => faulty;
    const isAvailable = () => ready && !isFaulty() && registration === null;

    const pooledWorker: InternalPooledWorker<TSuccess, TPayload> = {
      worker,
      isAvailable,
      isFaulty,
      register: (predicateId, payload, onSuccess, onFailure, onSkipped) => {
        if (!isAvailable()) {
          throw new Error('This instance of PooledWorker is currently in use');
        }
        const currentRunId = ++runIdInWorker;
        registration = { currentRunId, onSuccess, onFailure, onSkipped };
        const message: PoolToWorkerMessage<TPayload> = {
          targetPredicateId: predicateId,
          payload,
          runId: currentRunId,
        };
        worker.postMessage(message);
      },
      terminateIfStillRunning: async () => {
        if (registration !== null) {
          ready = false; // not ready anymore
          registration = null; // not running anything
          const workerIndex = this.workers.findIndex((w) => w.worker !== worker);
          this.workers.splice(workerIndex, 1); // remove the worker from the set of known workers
          await worker.terminate();
        }
      },
    };
    this.workers.push(pooledWorker);

    await waitOnline;
    return pooledWorker;
  }

  public getFirstAvailableWorker(): PooledWorker<TSuccess, TPayload> | undefined {
    return this.workers.find((w) => w.isAvailable());
  }

  public terminateAllWorkers(): Promise<void> {
    const dropped = this.workers.splice(0, this.workers.length); // clear all workers
    return Promise.all(dropped.map((w) => w.worker.terminate())).then(() => undefined);
  }
}
