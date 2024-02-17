import type { MessagePort } from 'node:worker_threads';
import type { MainThreadToWorkerMessage, PropertyPredicate, WorkerToMainThreadMessage } from '../SharedTypes.js';
import { writeFileSync } from 'fs';
import * as process from 'process';

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
): void {
  writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runWorker -> SETUP\n`, { flag: 'a' });
  parentPort.on('message', (message: MainThreadToWorkerMessage<Ts>) => {
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
    Promise.resolve(predicate(...payload)).then(
      (output) => {
        const message: WorkerToMainThreadMessage = { success: true, output, runId };
        writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runWorker -> PREDICATE OUTPUT\n`, {
          flag: 'a',
        });
        parentPort.postMessage(message);
      },
      (error) => {
        const message: WorkerToMainThreadMessage = { success: false, error, runId };
        writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] runWorker -> PREDICATE ERROR\n`, {
          flag: 'a',
        });
        parentPort.postMessage(message);
      },
    );
  });
}
