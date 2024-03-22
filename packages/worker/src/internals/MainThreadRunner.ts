import fc from 'fast-check';
import type { IAsyncPropertyWithHooks } from 'fast-check';
import type { PropertyArbitraries, WorkerProperty } from './SharedTypes.js';
import { BasicPool } from './worker-pool/BasicPool.js';
import { Lock } from './lock/Lock.js';
import type { IWorkerPool, PooledWorker } from './worker-pool/IWorkerPool.js';
import { OneTimePool } from './worker-pool/OneTimePool.js';
import { GlobalPool } from './worker-pool/GlobalPool.js';
import { generateValueFromState } from './ValueFromState.js';

class CustomAsyncProperty<Ts extends [unknown, ...unknown[]]> implements IAsyncPropertyWithHooks<Ts> {
  private readonly numArbitraries: number;
  private readonly internalProperty: IAsyncPropertyWithHooks<Ts>;
  private readonly captureRandomState: boolean;
  private paramsForGenerate: { randomGeneratorState: number[] | undefined; runId: number | undefined } | undefined;

  constructor(
    arbitraries: PropertyArbitraries<Ts>,
    predicate: (...args: Ts) => Promise<boolean | void>,
    captureRandomeState: boolean,
  ) {
    this.numArbitraries = arbitraries.length;
    this.internalProperty = fc.asyncProperty<Ts>(...arbitraries, predicate);
    this.captureRandomState = captureRandomeState;
  }

  isAsync(): true {
    return this.internalProperty.isAsync();
  }
  generate(mrng: fc.Random, runId?: number | undefined): fc.Value<Ts> {
    if (this.captureRandomState) {
      // Extracting and cloning the state of Random before altering it
      const state = mrng.getState()!;
      this.paramsForGenerate = { randomGeneratorState: state.slice(), runId };

      // The value will never be consummed by the main-thread except for reporting in case of error
      const internalProperty = this.internalProperty;
      let value: Ts | undefined = undefined;
      // eslint-disable-next-line no-inner-declarations
      function getValue(): Ts {
        if (value === undefined) {
          value = generateValueFromState(internalProperty, { rngState: state, runId });
        }
        return value;
      }
      return new fc.Value(
        [...Array(this.numArbitraries)].map((_, index) => ({
          toString: () => fc.stringify(getValue()[index]),
        })) as unknown as Ts,
        undefined,
      );
    }

    const value = this.internalProperty.generate(mrng, runId);
    return value;
  }
  shrink(value: fc.Value<Ts>): fc.Stream<fc.Value<Ts>> {
    if (this.captureRandomState) {
      // No shrink on worker-based generations
      return fc.Stream.nil();
    }
    return this.internalProperty.shrink(value);
  }
  run(v: Ts, dontRunHook?: boolean | undefined): Promise<fc.PreconditionFailure | fc.PropertyFailure | null> {
    return this.internalProperty.run(v, dontRunHook);
  }

  beforeEach(hookFunction: fc.AsyncPropertyHookFunction): fc.IAsyncPropertyWithHooks<Ts> {
    return this.internalProperty.beforeEach(hookFunction);
  }
  afterEach(hookFunction: fc.AsyncPropertyHookFunction): fc.IAsyncPropertyWithHooks<Ts> {
    return this.internalProperty.afterEach(hookFunction);
  }
  runBeforeEach() {
    if (this.internalProperty.runBeforeEach !== undefined) {
      return this.internalProperty.runBeforeEach();
    }
    return Promise.resolve();
  }
  runAfterEach() {
    if (this.internalProperty.runAfterEach !== undefined) {
      return this.internalProperty.runAfterEach();
    }
    return Promise.resolve();
  }

  getState(): { readonly randomGeneratorState: number[]; runId: number | undefined } | undefined {
    const state = this.paramsForGenerate;
    if (state === undefined || state.randomGeneratorState === undefined) {
      return undefined;
    }
    return { randomGeneratorState: state.randomGeneratorState, runId: state.runId };
  }
}

/**
 * Create a property able to run in the main thread and firing workers whenever required
 *
 * @param workerFileUrl - The URL towards the file holding the worker's code
 * @param predicateId - Id of the predicate
 * @param isolationLevel - The kind of isolation to be put in place between two executions of predicates
 * @param randomSource - Where should we generate the random values?
 * @param arbitraries - The arbitraries used to generate the inputs for the predicate hold within the worker
 */
export function runMainThread<Ts extends [unknown, ...unknown[]]>(
  workerFileUrl: URL,
  predicateId: number,
  isolationLevel: 'file' | 'property' | 'predicate',
  randomSource: 'main-thread' | 'worker',
  arbitraries: PropertyArbitraries<Ts>,
): { property: WorkerProperty<Ts>; terminateAllWorkers: () => Promise<void> } {
  const lock = new Lock();
  const pool: IWorkerPool<boolean | void, Ts> =
    isolationLevel === 'predicate'
      ? new OneTimePool(workerFileUrl)
      : isolationLevel === 'property'
        ? new BasicPool(workerFileUrl)
        : new GlobalPool(workerFileUrl);

  let releaseLock: (() => void) | undefined = undefined;
  let worker: PooledWorker<boolean | void, Ts> | undefined = undefined;
  const property = new CustomAsyncProperty<Ts>(
    arbitraries,
    async (...inputs) => {
      return new Promise((resolve, reject) => {
        if (worker === undefined) {
          reject(new Error('Badly initialized worker, unable to run the property'));
          return;
        }
        worker.register(predicateId, inputs, property.getState(), resolve, reject);
      });
    },
    randomSource === 'worker',
  );
  property.beforeEach(async (hookFunction) => {
    await hookFunction(); // run outside of the worker, can throw
    const acquired = await lock.acquire();
    releaseLock = acquired.release;
    worker = pool.getFirstAvailableWorker() || (await pool.spawnNewWorker()); // can throw
  });
  property.afterEach(async (hookFunction) => {
    if (worker !== undefined) {
      worker.terminateIfStillRunning().catch(() => void 0); // no need to wait for the termination
      worker = undefined;
    }
    if (releaseLock !== undefined) {
      releaseLock();
      releaseLock = undefined;
    }
    await hookFunction(); // run outside of the worker, can throw
  });
  const terminateAllWorkers = () => pool.terminateAllWorkers();
  return { property, terminateAllWorkers };
}
