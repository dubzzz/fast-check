import type { MessagePort } from 'node:worker_threads';
import type { MainThreadToWorkerMessage, PropertyPredicate, WorkerToMainThreadMessage } from '../SharedTypes.js';

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
  buildPayload: (state: number[], runId: number | undefined) => Ts,
): void {
  parentPort.on('message', (message: MainThreadToWorkerMessage<Ts>) => {
    const { content, targetPredicateId, runId } = message;
    if (targetPredicateId !== predicateId) {
      // The current predicate is not the one targeted by the received message
      return;
    }
    const payload =
      content.source === 'main' ? content.payload : buildPayload(content.randomGeneratorState, content.runId);
    Promise.resolve(predicate(...payload)).then(
      (output) => {
        const message: WorkerToMainThreadMessage = { success: true, output, runId };
        parentPort.postMessage(message);
      },
      (error) => {
        const message: WorkerToMainThreadMessage = { success: false, error, runId };
        parentPort.postMessage(message);
      },
    );
  });
}
