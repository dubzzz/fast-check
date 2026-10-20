import type { PropertyArbitraries, WorkerProperty } from './SharedTypes.js';
import { BasicPool } from './worker-pool/BasicPool.js';
import { Lock } from './lock/Lock.js';
import type { IWorkerPool, Payload, PooledWorker } from './worker-pool/IWorkerPool.js';
import { OneTimePool } from './worker-pool/OneTimePool.js';
import { GlobalPool } from './worker-pool/GlobalPool.js';
import { buildWorkerProperty } from './worker-property/WorkerPropertyBuilder.js';
import { PreconditionFailure } from 'fast-check';
import type { PredicateExecutionContext, UniversalPlugin } from 'fast-check';

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
): {
  property: WorkerProperty<Ts>;
  workerPlugin: UniversalPlugin;
  terminateAllWorkers: () => Promise<void>;
} {
  const lock = new Lock();
  const pool: IWorkerPool<boolean | void, Payload<Ts>> = isolationLevel === 'predicate'
    ? new OneTimePool(workerFileUrl)
    : isolationLevel === 'property'
      ? new BasicPool(workerFileUrl)
      : new GlobalPool(workerFileUrl);

  let releaseLock: (() => void) | undefined = undefined;
  let worker: PooledWorker<boolean | void, Payload<Ts>> | undefined = undefined;
  let removeAbortListener: (() => void) | undefined = undefined;
  const property = buildWorkerProperty(
    arbitraries,
    async (...inputs) => {
      const executionContext = inputs[arbitraries.length] as PredicateExecutionContext | undefined;
      const signal = executionContext?.signal;
      let onAbort: (() => void) | undefined = undefined;
      const clearAbortListener = () => {
        if (signal !== undefined && onAbort !== undefined) {
          signal.removeEventListener('abort', onAbort);
          onAbort = undefined;
        }
      };
      try {
        return await new Promise<boolean | void>((resolve, reject) => {
          if (worker === undefined) {
            reject(new Error('Badly initialized worker, unable to run the property'));
            return;
          }
          if (signal !== undefined) {
            if (signal.aborted) {
              reject(signal.reason);
              return;
            }
            onAbort = () => reject(signal.reason);
            signal.addEventListener('abort', onAbort, { once: true });
            removeAbortListener = clearAbortListener;
          }
          const generatedInputs = (
            inputs.length === arbitraries.length ? inputs : inputs.slice(0, arbitraries.length)
          ) as Ts;
          worker.register(predicateId, property.getPayload(generatedInputs), resolve, reject, () =>
            reject(new PreconditionFailure()),
          );
        });
      } finally {
        clearAbortListener();
      }
    },
    randomSource === 'worker',
  );
  const workerPlugin: UniversalPlugin = () => {
    return {
      decorateRun: (nestedRun) => async (value, executionContext) => {
        try {
          // NOTE: Being capable of enriching the context of the runner with extra pieces
          // would make us capable of forwarding the worker variable safely to the runner
          const acquired = await lock.acquire();
          releaseLock = acquired.release;
          worker = pool.getFirstAvailableWorker() || (await pool.spawnNewWorker()); // can throw
          return await nestedRun(value, executionContext);
        } catch (error) {
          return { error };
        } finally {
          if (removeAbortListener !== undefined) {
            removeAbortListener();
            removeAbortListener = undefined;
          }
          if (worker !== undefined) {
            worker.terminateIfStillRunning().catch(() => void 0); // no need to wait for the termination
            worker = undefined;
          }
          if (releaseLock !== undefined) {
            releaseLock();
            releaseLock = undefined;
          }
        }
      },
    };
  };
  const terminateAllWorkers = () => pool.terminateAllWorkers();
  return { property, workerPlugin, terminateAllWorkers };
}
