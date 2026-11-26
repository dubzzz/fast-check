import type { Arbitrary, assert, Plugin } from 'fast-check';
import type { PoolToWorkerMessage, WorkerToPoolMessage } from './worker-pool/IWorkerPool.js';

// Derive these types from APIs shared by fast-check v4 and v5.
export type Property<Ts> = Parameters<typeof assert<Ts>>[0];
export type UniversalPlugin = <Ts>(...args: Parameters<Plugin<Ts>>) => ReturnType<Plugin<Ts>>;
export type PredicateExecutionContext =
  Parameters<Property<unknown>['run']> extends [unknown, infer Context]
    ? Context
    : { signal?: AbortSignal | undefined };

type LegacyGlobalPropertyHookFunction = (() => Promise<unknown>) | (() => void);
export type LegacyPropertyHookFunction =
  | ((previousHookFunction: LegacyGlobalPropertyHookFunction) => Promise<unknown>)
  | ((previousHookFunction: LegacyGlobalPropertyHookFunction) => void);

// Preserve required hooks from v4's Property while allowing their absence in v5.
export type LegacyPropertyWithHooks<Ts> = Property<Ts> & {
  // On Property in v4.x
  runBeforeEach?: () => Promise<void> | void;
  runAfterEach?: () => Promise<void> | void;
  // On PropertyWithHooks in v4.x
  beforeEach?(hookFunction: LegacyPropertyHookFunction): LegacyPropertyWithHooks<Ts>;
  afterEach?(hookFunction: LegacyPropertyHookFunction): LegacyPropertyWithHooks<Ts>;
};

export type PropertyArbitraries<Ts extends unknown[]> = {
  [K in keyof Ts]: Arbitrary<Ts[K]>;
};
export type PropertyPredicate<Ts extends unknown[]> = (
  ...args: [...Ts, PredicateExecutionContext]
) => boolean | void | Promise<boolean | void>;
export type WorkerProperty<Ts> = LegacyPropertyWithHooks<Ts>;

export type MainThreadToWorkerMessage<Ts> = PoolToWorkerMessage<Ts>;

export type WorkerToMainThreadMessage = WorkerToPoolMessage<boolean | void>;
