import type { MessagePort } from 'node:worker_threads';
import type { MainThreadToWorkerMessage, WorkerToMainThreadMessage } from '../SharedTypes.js';
import { WorkerToPoolMessageStatus } from '../worker-pool/IWorkerPool.js';

/**
 * Setup the fallback worker listening to all predicates and rejecting any that has never been registered
 * @param parentPort - the parent to listen to and sending us queries to execute
 * @param registeredPredicates - list of all the predicates currently registered, can be updated after the call to runNoWorker
 */
export function runNoWorker(parentPort: MessagePort, registeredPredicates: Set<number>): void {
  parentPort.on('message', (message: MainThreadToWorkerMessage<unknown>) => {
    const { targetPredicateId, runId } = message;
    if (registeredPredicates.has(targetPredicateId)) {
      return;
    }
    const errorMessage = `Unregistered predicate, got: ${targetPredicateId}, for registered: ${[
      ...registeredPredicates,
    ].join(', ')}`;
    const sentMessage: WorkerToMainThreadMessage = {
      status: WorkerToPoolMessageStatus.Failure,
      error: new Error(errorMessage),
      runId,
    };
    parentPort.postMessage(sentMessage);
  });
}
