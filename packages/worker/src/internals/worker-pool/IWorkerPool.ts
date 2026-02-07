import type { ValueState } from '../ValueFromState.js';

export type OnSuccessCallback<TSuccess> = (value: TSuccess) => void;
export type OnErrorCallback = (error: unknown) => void;
export type OnSkippedCallback = () => void;

/**
 * Worker API
 */
export type PooledWorker<TSuccess, TPayload> = {
  isAvailable: () => boolean;
  isFaulty: () => boolean;
  register: (
    predicateId: number,
    payload: TPayload,
    onSuccess: OnSuccessCallback<TSuccess>,
    onFailure: OnErrorCallback,
    onSkipped: OnSkippedCallback,
  ) => void;
  terminateIfStillRunning: () => Promise<void>;
};

/**
 * Message exchanged from the pool to the worker
 */
export type PoolToWorkerMessage<TPayload> = {
  targetPredicateId: number;
  runId: number;
  payload: TPayload;
};

/**
 * Payload being sent to the worker to control it
 */
export type Payload<TValue> = { source: 'main'; value: TValue } | ({ source: 'worker' } & ValueState);

/**
 * Status of the execution by the worker
 */
export enum WorkerToPoolMessageStatus {
  Success = 'o',
  Skipped = '-',
  Failure = 'x',
}

/**
 * Message exchanged from the worker to the pool
 */
export type WorkerToPoolMessage<TSuccess> = { runId: number } & (
  | { status: WorkerToPoolMessageStatus.Success; output: TSuccess }
  | { status: WorkerToPoolMessageStatus.Skipped }
  | { status: WorkerToPoolMessageStatus.Failure; error: unknown }
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
