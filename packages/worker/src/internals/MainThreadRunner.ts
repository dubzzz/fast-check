import { Worker } from 'node:worker_threads';
import fc from 'fast-check';
import {
  type WorkerToMainThreadMessage,
  type PropertyArbitraries,
  type WorkerProperty,
  type MainThreadToWorkerMessage,
} from './SharedTypes.js';

/**
 * Create a property able to run in the main thread and firing workers whenever required
 *
 * @param workerFileUrl - The URL towards the file holding the worker's code
 * @param workerId - Id of the worker
 * @param arbitraries - The arbitraries used to generate the inputs for the predicate hold within the worker
 * @param onNewWorker - Callback function to be called whenever a new worker gets created
 */
export function runMainThread<Ts extends [unknown, ...unknown[]]>(
  workerFileUrl: URL,
  workerId: number,
  arbitraries: PropertyArbitraries<Ts>,
  onNewWorker: (worker: Worker) => void
): WorkerProperty<Ts> {
  let lastRunId = -1;
  return fc.asyncProperty<Ts>(...arbitraries, async (...inputs) => {
    return new Promise((resolve, reject) => {
      const currentRunId = ++lastRunId;
      const worker = new Worker(workerFileUrl, { workerData: { currentWorkerId: workerId } });
      onNewWorker(worker);

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
