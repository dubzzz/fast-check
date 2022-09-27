import { type MessagePort } from 'node:worker_threads';
import {
  type MainThreadToWorkerMessage,
  type PropertyPredicate,
  type WorkerToMainThreadMessage,
} from './SharedTypes.js';

/**
 * Setup a worker listenning to parentPort and able to run a single time for a given predicate
 * @param parentPort - the parent to listen to and sending us queries to execute
 * @param predicate - the predicate to assess
 */
export function runWorker<Ts extends unknown[]>(parentPort: MessagePort, predicate: PropertyPredicate<Ts>): void {
  parentPort.on('message', (message: MainThreadToWorkerMessage<Ts>) => {
    const { payload, runId } = message;
    Promise.resolve(predicate(...payload)).then(
      (output) => {
        const message: WorkerToMainThreadMessage = { success: true, output, runId };
        parentPort.postMessage(message);
      },
      (error) => {
        const message: WorkerToMainThreadMessage = { success: false, error, runId };
        parentPort.postMessage(message);
      }
    );
  });
}
