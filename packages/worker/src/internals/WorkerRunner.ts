import { type MessagePort } from 'node:worker_threads';
import { type MainThreadToWorkerMessage, type WorkerToMainThreadMessage } from './SharedTypes.js';

/**
 * Setup a worker listenning to parentPort and able to run a single time for a given predicate
 * @param parentPort - the parent to listen to and sending us queries to execute
 * @param predicate - the predicate to assess
 */
export function runWorker<Ts extends unknown[]>(
  parentPort: MessagePort,
  predicate: (...args: Ts) => Promise<boolean | void>
): void {
  // TODO - Workers should be able to be re-used through executions of the same predicate
  // in order to increase the overall performance of a worker-based version
  parentPort.once('message', (payload: MainThreadToWorkerMessage<Ts>) => {
    const { inputs, runId } = payload;
    Promise.resolve(predicate(...inputs)).then(
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
