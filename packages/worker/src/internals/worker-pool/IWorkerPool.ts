import type { ValueState } from '../ValueFromState';

export type OnSuccessCallback<TSuccess> = (value: TSuccess) => void;
export type OnErrorCallback = (error: unknown) => void;

/**
 * Worker API
 */
export type PooledWorker<TSuccess, TPayload> = {
  isAvailable: () => boolean;
  isFaulty: () => boolean;
  register: (
    predicateId: number,
    payload: TPayload,
    state: { randomGeneratorState: number[]; runId: number | undefined } | undefined,
    onSuccess: OnSuccessCallback<TSuccess>,
    onFailure: OnErrorCallback,
  ) => void;
  terminateIfStillRunning: () => Promise<void>;
};

/**
 * Message exchanged from the pool to the worker
 */
export type PoolToWorkerMessage<TPayload> = {
  targetPredicateId: number;
  runId: number;
  content: { source: 'main'; payload: TPayload } | ({ source: 'worker' } & ValueState);
};

/**
 * Message exchanged from the worker to the pool
 */
export type WorkerToPoolMessage<TSuccess> = { runId: number } & (
  | { success: true; output: TSuccess }
  | { success: false; error: unknown }
);

/**
 * Worker pool interface
 */
export interface IWorkerPool<TSuccess, TPayload> {
  /**
   * Spawn a new instance of worker ready to handle new tasks
   */
  spawnNewWorker(): Promise<PooledWorker<TSuccess, TPayload>>;

  /**
   * Get the first available worker of the pool if any
   */
  getFirstAvailableWorker(): PooledWorker<TSuccess, TPayload> | undefined;

  /**
   * Terminate all registered workers and drop them definitely for the pool
   */
  terminateAllWorkers(): Promise<void>;
}
