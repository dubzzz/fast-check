import type { Arbitrary, IAsyncPropertyWithHooks } from 'fast-check';

export type PropertyArbitraries<Ts extends unknown[]> = {
  [K in keyof Ts]: Arbitrary<Ts[K]>;
};
export type PropertyPredicate<Ts extends unknown[]> = (...args: Ts) => Promise<boolean | void>;
export type WorkerProperty<Ts> = IAsyncPropertyWithHooks<Ts>;

export type MainThreadToWorkerMessage<Ts> = { runId: number; inputs: Ts };

export type WorkerToMainThreadMessage = { runId: number } & (
  | { success: true; output: boolean | void }
  | { success: false; error: unknown }
);
