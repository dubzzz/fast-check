import type { Arbitrary, IRawProperty } from 'fast-check';
import type { PoolToWorkerMessage, WorkerToPoolMessage } from './worker-pool/IWorkerPool.js';

export type PropertyArbitraries<Ts extends unknown[]> = {
  [K in keyof Ts]: Arbitrary<Ts[K]>;
};
export type PropertyPredicate<Ts extends unknown[]> = (...args: Ts) => boolean | void | Promise<boolean | void>;
export type WorkerProperty<Ts> = IRawProperty<Ts, true>;

export type MainThreadToWorkerMessage<Ts> = PoolToWorkerMessage<Ts>;

export type WorkerToMainThreadMessage = WorkerToPoolMessage<boolean | void>;
