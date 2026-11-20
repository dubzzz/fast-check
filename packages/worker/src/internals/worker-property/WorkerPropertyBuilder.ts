import type { LegacyPropertyWithHooks, PredicateExecutionContext, PropertyArbitraries } from '../SharedTypes.js';
import type { Payload } from '../worker-pool/IWorkerPool.js';

import { WorkerPropertyFromWorker } from './WorkerPropertyFromWorker.js';
import { asyncPropertyV4V5 } from '../AsyncPropertyV4V5.js';

/**
 * Property tailored for usage with workers
 * it produces the payload to be sent to the workers
 */
type WorkerProperty<Ts> = LegacyPropertyWithHooks<Ts> & { getPayload: (_inputs: Ts) => Payload<Ts> };

/**
 * Build an async property tailored for workers
 * @param arbitraries - Arbitraries supposed to generate our values
 * @param predicate - Predicate for the property
 * @param generateValuesInMainThread - When "true" the value gets generated inside the property itself, otherwise responsability goes to the worker
 */
export function buildWorkerProperty<Ts extends [unknown, ...unknown[]]>(
  arbitraries: PropertyArbitraries<Ts>,
  predicate: NoInfer<(...args: [...Ts, PredicateExecutionContext?]) => Promise<boolean | void>>,
  generateValuesInMainThread: boolean,
): WorkerProperty<Ts> {
  if (!generateValuesInMainThread) {
    return Object.assign(asyncPropertyV4V5<Ts>(...arbitraries, predicate), {
      getPayload: (inputs: Ts): Payload<Ts> => ({ source: 'main', value: inputs }),
    });
  }
  return new WorkerPropertyFromWorker(arbitraries, predicate);
}
