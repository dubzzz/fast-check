import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import fc from 'fast-check';

type ParentPortType = NonNullable<typeof parentPort>;

/**
 * Setup a worker listenning to parentPort and able to run many times the same predicate
 * @param parentPort - the parent to listen to and sending us queries to execute
 * @param predicate - the predicate to assess
 */
function runWorker<Ts extends unknown[]>(
  parentPort: ParentPortType,
  predicate: (...args: Ts) => Promise<boolean | void>
): void {
  parentPort.on('message', (payload: { ins: Ts; runId: number }) => {
    // TODO Handle killed worker
    const { ins, runId } = payload;
    Promise.resolve(predicate(...ins)).then(
      (output) => parentPort.postMessage({ success: true, output, runId }),
      (error) => parentPort.postMessage({ success: false, error, runId })
    );
  });
}

export type WorkerProperty<Ts> = fc.IAsyncPropertyWithHooks<Ts> & { start: () => () => void };

type WorkerPool<Ts extends unknown[]> = {
  startPool: () => {stop:()=> void}
  acquireOne: ()=>{release: () => void}
}
function workerPool<Ts extends unknown[]>(url: URL, currentWorkerId: number):WorkerPool<Ts> {
  // startPool
  // -> stop
  // acquireOne (implicitely)
  // -> release
  const workers: Worker[] = [];
  return {
    startPool: () =>
  }
}

function runMainThread(): WorkerProperty<Ts> {
  const workers: Worker[] = [];
}

let lastWorkerId = 0;
export function workerProperty<Ts extends [unknown, ...unknown[]]>(
  url: URL,
  ...args: [
    ...arbitraries: {
      [K in keyof Ts]: fc.Arbitrary<Ts[K]>;
    },
    predicate: (...args: Ts) => Promise<boolean | void>
  ]
): WorkerProperty<Ts> {
  const currentWorkerId = ++lastWorkerId;

  if (isMainThread) {
    // Main thread code
    let runId = 0;
    const arbitraries = args.slice(0, -1);
    let worker: Worker;
    const waitingStops = new Set();
    const tasks = new Map();

    function requestNew(ins, resolve, reject) {
      const currentRunId = ++runId;
      tasks.set(currentRunId, { resolve, reject });
      worker.postMessage({ ins, runId: currentRunId });
    }
    return Object.assign(
      fc.asyncProperty(...arbitraries, async (...ins) => {
        return new Promise((resolve, reject) => {
          requestNew(ins, resolve, reject);
        });
      }),
      {
        start: () => {
          if (worker === undefined) {
            worker = new Worker(url, {
              workerData: { currentWorkerId },
            });
            worker.on('message', (data) => {
              const task = tasks.get(data.runId);
              if (task !== undefined) {
                tasks.delete(data.runId);
                if (data.success) {
                  task.resolve(data.output);
                } else {
                  task.reject(data.error);
                }
              }
            });
            worker.on('error', (err) => {
              for (const { reject } of tasks.values()) {
                reject(err);
              }
            });
            worker.on('exit', (code) => {
              if (code !== 0) {
                for (const { reject } of tasks.values()) {
                  reject(new Error(`Worker stopped with exit code ${code}`));
                }
              }
            });
          }
          const stop = () => {
            waitingStops.delete(stop);
            if (waitingStops.size === 0) {
              worker.terminate();
              worker = undefined;
            }
          };
          waitingStops.add(stop);
          return stop;
        },
      }
    );
  } else if (parentPort !== null && currentWorkerId === workerData.currentWorkerId) {
    // Worker code
    const predicate = args[args.length - 1] as (...args: Ts) => Promise<boolean | void>;
    runWorker(parentPort, predicate);
  }
}

function assertWorker(p, opts) {
  const stop = p.start();
  return fc.assert(p, opts).finally(() => stop());
}
