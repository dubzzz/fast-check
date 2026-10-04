import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as workerThreads from 'node:worker_threads';
import * as fc from 'fast-check';
import { propertyFor } from '../src/main.js';
import { buildWorkerProperty } from '../src/internals/worker-property/WorkerPropertyBuilder.js';

vi.mock('node:worker_threads', async (importOriginal) => ({
  ...(await importOriginal<typeof workerThreads>()),
  isMainThread: false,
  workerData: { fastcheckWorker: true },
  parentPort: { on: vi.fn(), postMessage: vi.fn() },
}));

vi.mock('fast-check', async (importOriginal) => {
  const actual = await importOriginal<typeof fc>();
  return {
    ...actual,
    asyncProperty: actual.property,
    property: () => {
      throw new Error('The legacy synchronous property must not be used');
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('legacy asyncProperty export', () => {
  it.each([false, true])('should use asyncProperty with worker-side generation: %s', async (workerSide) => {
    const predicate = vi.fn(async (_value: number) => {
      await Promise.resolve();
      return true;
    });
    const property = buildWorkerProperty([fc.constant(42)], predicate, workerSide);

    expect(await property.run([42])).toBe(null);
    expect(predicate).toHaveBeenCalledWith(42);
  });

  it('should use asyncProperty when registering a predicate inside a worker', () => {
    const property = propertyFor(new URL('file:///legacy-property.mjs'));

    property(fc.constant(42), async (_value) => {});

    expect(workerThreads.parentPort?.on).toHaveBeenCalledOnce();
    expect(workerThreads.parentPort?.on).toHaveBeenCalledWith('message', expect.any(Function));
  });
});
