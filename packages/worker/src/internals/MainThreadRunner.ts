import { Worker } from 'node:worker_threads';
import fc from 'fast-check';
import {
  type WorkerToMainThreadMessage,
  type PropertyArbitraries,
  type WorkerProperty,
  type MainThreadToWorkerMessage,
} from './SharedTypes';

/**
 *
 * @param workerFileUrl - The URL towards the file holding the worker's code
 * @param arbitraries - The arbitraries used to generate the inputs for the predicate hold within the worker
 */
export function runMainThread<Ts extends [unknown, ...unknown[]]>(
  workerFileUrl: URL,
  arbitraries: PropertyArbitraries<Ts>
): WorkerProperty<Ts> {
  let lastRunId = -1;
  return fc.asyncProperty<Ts>(...arbitraries, async (...inputs) => {
    return new Promise((resolve, reject) => {
      const currentRunId = ++lastRunId;
      const worker = new Worker(workerFileUrl);

      // Register to the worker
      worker.on('message', (data: WorkerToMainThreadMessage) => {
        if (data.runId !== currentRunId) {
          return;
        }
        if (data.success) {
          resolve(data.output);
        } else {
          reject(data.error);
        }
      });
      worker.on('error', (err) => {
        reject(err);
      });
      worker.on('exit', (code) => {
        reject(new Error(`Worker stopped with exit code ${code}`));
      });

      // Start the worker
      const message: MainThreadToWorkerMessage<Ts> = { inputs, runId: currentRunId };
      worker.postMessage(message);
    });
  });
}
