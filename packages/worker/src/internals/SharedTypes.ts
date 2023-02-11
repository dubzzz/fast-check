import type { Arbitrary, IAsyncPropertyWithHooks } from 'fast-check';
import { type PoolToWorkerMessage, type WorkerToPoolMessage } from './worker-pool/BasicPool.js';

export type PropertyArbitraries<Ts extends unknown[]> = {
  [K in keyof Ts]: Arbitrary<Ts[K]>;
};
export type PropertyPredicate<Ts extends unknown[]> = (...args: Ts) => boolean | void | Promise<boolean | void>;
export type WorkerProperty<Ts> = IAsyncPropertyWithHooks<Ts>;

export type MainThreadToWorkerMessage<Ts> = PoolToWorkerMessage<Ts>;

export type WorkerToMainThreadMessage = WorkerToPoolMessage<boolean | void>;
