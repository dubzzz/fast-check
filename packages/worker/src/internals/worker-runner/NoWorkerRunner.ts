import type { MessagePort } from 'node:worker_threads';
import type { MainThreadToWorkerMessage, WorkerToMainThreadMessage } from '../SharedTypes.js';
import { WorkerToPoolMessageStatus } from '../worker-pool/IWorkerPool.js';
import { writeFileSync } from 'node:fs';

/**
 * Setup the fallback worker listening to all predicates and rejecting any that has never been registered
 * @param parentPort - the parent to listen to and sending us queries to execute
 * @param registeredPredicates - list of all the predicates currently registered, can be updated after the call to runNoWorker
 */
export function runNoWorker(parentPort: MessagePort, registeredPredicates: Set<number>): void {
  writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runNoWorker -> SETUP\n`, { flag: 'a' });
  parentPort.on('message', (message: MainThreadToWorkerMessage<unknown>) => {
    try {
      writeFileSync(
        '/workspaces/fast-check/debug.log',
        `[${process.pid}] runNoWorker -> MESSAGE RECEIVED ${JSON.stringify(message)}\n`,
        {
          flag: 'a',
        },
      );
    } catch (err) {
      writeFileSync(
        '/workspaces/fast-check/debug.log',
        `[${process.pid}] runNoWorker -> MESSAGE RECEIVED {{{!!!}}}\n`,
        { flag: 'a' },
      );
    }
    const { targetPredicateId, runId } = message;
    if (registeredPredicates.has(targetPredicateId)) {
      writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runNoWorker -> REGISTRATION CONFIRMED\n`, {
        flag: 'a',
      });
      return;
    }
    const errorMessage = `Unregistered predicate, got: ${targetPredicateId}, for registered: ${[
      ...registeredPredicates,
    ].join(', ')}`;
    writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runNoWorker -> REGISTRATION NOT-FOUND\n`, {
      flag: 'a',
    });
    const sentMessage: WorkerToMainThreadMessage = {
      status: WorkerToPoolMessageStatus.Failure,
      error: new Error(errorMessage),
      runId,
    };
    parentPort.postMessage(sentMessage);
  });
}
