import type { Arbitrary, Property, PredicateExecutionContext } from 'fast-check';
import type { PoolToWorkerMessage, WorkerToPoolMessage } from './worker-pool/IWorkerPool.js';

type LegacyGlobalPropertyHookFunction = (() => Promise<unknown>) | (() => void);
export type LegacyPropertyHookFunction =
  | ((previousHookFunction: LegacyGlobalPropertyHookFunction) => Promise<unknown>)
  | ((previousHookFunction: LegacyGlobalPropertyHookFunction) => void);

export interface LegacyPropertyWithHooks<Ts> extends Property<Ts> {
  // On Property in v4.x
  runBeforeEach: () => Promise<void> | void;
  runAfterEach: () => Promise<void> | void;
  // On PropertyWithHooks in v4.x
  beforeEach(hookFunction: LegacyPropertyHookFunction): LegacyPropertyWithHooks<Ts>;
  afterEach(hookFunction: LegacyPropertyHookFunction): LegacyPropertyWithHooks<Ts>;
}

export type PropertyArbitraries<Ts extends unknown[]> = {
  [K in keyof Ts]: Arbitrary<Ts[K]>;
};
export type PropertyPredicate<Ts extends unknown[]> = (
  ...args: [...Ts, PredicateExecutionContext]
) => boolean | void | Promise<boolean | void>;
export type WorkerProperty<Ts> = LegacyPropertyWithHooks<Ts>;

export type MainThreadToWorkerMessage<Ts> = PoolToWorkerMessage<Ts>;

export type WorkerToMainThreadMessage = WorkerToPoolMessage<boolean | void>;
