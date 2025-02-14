import type { MessagePort } from 'node:worker_threads';
import type { MainThreadToWorkerMessage, PropertyPredicate, WorkerToMainThreadMessage } from '../SharedTypes.js';
import type { ValueState } from '../ValueFromState.js';
import { WorkerToPoolMessageStatus, type Payload } from '../worker-pool/IWorkerPool.js';
import { PreconditionFailure } from 'fast-check';
import { writeFileSync } from 'node:fs';

/**
 * Setup a worker listening to parentPort and able to run a single time for a given predicate
 * @param parentPort - the parent to listen to and sending us queries to execute
 * @param predicateId - the id of the predicate
 * @param predicate - the predicate to assess
 */
export function runWorker<Ts extends unknown[]>(
  parentPort: MessagePort,
  predicateId: number,
  predicate: PropertyPredicate<Ts>,
  buildInputs: (state: ValueState) => Ts,
): void {
  writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runWorker -> SETUP\n`, { flag: 'a' });
  parentPort.on('message', (message: MainThreadToWorkerMessage<Payload<Ts>>) => {
    try {
      writeFileSync(
        '/workspaces/fast-check/debug.log',
        `[${process.pid}] runWorker -> MESSAGE RECEIVED ${JSON.stringify(message)}\n`,
        {
          flag: 'a',
        },
      );
    } catch (err) {
      writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runWorker -> MESSAGE RECEIVED {{{!!!}}}\n`, {
        flag: 'a',
      });
    }
    const { payload, targetPredicateId, runId } = message;
    if (targetPredicateId !== predicateId) {
      // The current predicate is not the one targeted by the received message
      return;
    }
    const inputs = payload.source === 'main' ? payload.value : buildInputs(payload);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    wrapAndRunAsPromise(predicate, inputs).then(
      (output) => {
        const message: WorkerToMainThreadMessage = { status: WorkerToPoolMessageStatus.Success, output, runId };
        writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runWorker -> PREDICATE OUTPUT\n`, {
          flag: 'a',
        });
        parentPort.postMessage(message);
      },
      (error) => {
        const message: WorkerToMainThreadMessage = PreconditionFailure.isFailure(error)
          ? { status: WorkerToPoolMessageStatus.Skipped, runId }
          : { status: WorkerToPoolMessageStatus.Failure, error, runId };
        writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runWorker -> PREDICATE ERROR\n`, {
          flag: 'a',
        });
        parentPort.postMessage(message);
      },
    );
  });
}

/**
 * Wrap and run the predicate within a safe instance of Promise not throwing synchronously but rejecting asynchronously
 * @param predicate - the predicate to assess
 * @param inputs - the inputs for the predicate
 */
function wrapAndRunAsPromise<Ts extends unknown[]>(
  predicate: PropertyPredicate<Ts>,
  inputs: Ts,
): Promise<boolean | void> {
  try {
    return Promise.resolve(predicate(...inputs));
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(err);
  }
}
