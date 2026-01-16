import type { IRawProperty } from 'fast-check';
import type { PropertyArbitraries } from '../SharedTypes.js';
import type { Payload } from '../worker-pool/IWorkerPool.js';

import fc from 'fast-check';
import { WorkerPropertyFromWorker } from './WorkerPropertyFromWorker.js';

/**
 * Property tailored for usage with workers
 * it produces the payload to be sent to the workers
 */
type WorkerProperty<Ts> = IRawProperty<Ts, true> & { getPayload: (_inputs: Ts) => Payload<Ts> };

/**
 * Build an async property tailored for workers
 * @param arbitraries - Arbitraries supposed to generate our values
 * @param predicate - Predicate for the property
 * @param generateValuesInMainThread - When "true" the value gets generated inside the property itself, otherwise responsability goes to the worker
 */
export function buildWorkerProperty<Ts extends [unknown, ...unknown[]]>(
  arbitraries: PropertyArbitraries<Ts>,
  predicate: (...args: Ts) => Promise<boolean | void>,
  generateValuesInMainThread: boolean,
): WorkerProperty<Ts> {
  if (!generateValuesInMainThread) {
    const baseProperty = fc.asyncProperty<Ts>(...arbitraries, predicate);
    return Object.assign(baseProperty, {
      getPayload: (inputs: Ts): Payload<Ts> => ({ source: 'main', value: inputs }),
    });
  }
  return new WorkerPropertyFromWorker(arbitraries, predicate);
}
