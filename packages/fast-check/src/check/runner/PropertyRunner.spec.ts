import { describe, expect, it, vi } from 'vitest';
import { propertyRunner } from './PropertyRunner.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import * as fc from 'fast-check';

describe('propertyRunner', () => {
  it.each([
    { runOutput: null, runOutputFriendly: 'null' },
    { runOutput: { error: new Error() }, runOutputFriendly: 'PropertyFailure' },
    { runOutput: new PreconditionFailure(), runOutputFriendly: 'PreconditionFailure' },
  ])('should return synchronously when all runs are synchronously returning $runOutputFriendly', ({ runOutput }) => {
    // Arrange
    const expectedValues = [1, 2, 3]; // strictly more than 1 element
    function* generator() {
      yield* expectedValues;
    }
    const handleResult = vi.fn();
    const iterator = Object.assign(generator(), { handleResult });
    const run = vi.fn(() => runOutput);

    // Act
    const out = propertyRunner(iterator, run);

    // Assert
    expect(out).toBe(undefined);
    expect(out).not.toBeInstanceOf(Promise);
    expect(run).toHaveBeenCalledTimes(expectedValues.length);
    expect(run.mock.calls).toEqual(expectedValues.map((v) => [v]));
    expect(handleResult).toHaveBeenCalledTimes(expectedValues.length);
  });

  it.each([
    { runOutput: null, runOutputFriendly: 'null' },
    { runOutput: { error: new Error() }, runOutputFriendly: 'PropertyFailure' },
    { runOutput: new PreconditionFailure(), runOutputFriendly: 'PreconditionFailure' },
  ])(
    'should return asynchronously when all runs are asynchronously returning $runOutputFriendly',
    async ({ runOutput }) => {
      // Arrange
      const expectedValues = [1, 2, 3]; // strictly more than 1 element
      function* generator() {
        yield* expectedValues;
      }
      const handleResult = vi.fn();
      const iterator = Object.assign(generator(), { handleResult });
      const run = vi.fn(async () => runOutput);

      // Act
      const out = propertyRunner(iterator, run);

      // Assert
      expect(out).not.toBe(undefined);
      expect(out).toBeInstanceOf(Promise);
      expect(run).not.toHaveBeenCalledTimes(expectedValues.length);
      expect(handleResult).not.toHaveBeenCalledTimes(expectedValues.length);
      await out;
      expect(run).toHaveBeenCalledTimes(expectedValues.length);
      expect(run.mock.calls).toEqual(expectedValues.map((v) => [v]));
      expect(handleResult).toHaveBeenCalledTimes(expectedValues.length);
    },
  );

  it('should always batch together in the same micro-tasks all consecutive synchronous runs', async () => {
    let getCount: () => number = () => -1;
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ value: fc.constantFrom(null), sync: fc.boolean() }), { minLength: 2 }),
        async (runValues) => {
          // Arrange
          function* generator() {
            yield* Array(runValues.length).fill(1);
          }
          const handleResult = vi.fn();
          const iterator = Object.assign(generator(), { handleResult });
          let runIndex = 0;
          let lastRun: { count: number; sync: boolean } | undefined = undefined;
          let wellSpaced = true;
          const observedCounts: number[] = [];
          const run = vi.fn(() => {
            const currentCount = getCount();
            observedCounts.push(currentCount);
            if (lastRun !== undefined) {
              if (lastRun.sync) {
                wellSpaced &&= lastRun.count === currentCount; // Count must stay the same if previous was sync
              } else {
                wellSpaced &&= lastRun.count < currentCount; // Count must change to something higher if previous was async
              }
            }
            const runValue = runValues[runIndex++];
            lastRun = { count: currentCount, sync: runValue.sync };
            return runValue.sync ? runValue.value : Promise.resolve(runValue.value);
          });

          // Act
          await propertyRunner(iterator, run);

          // Assert
          expect(wellSpaced ? undefined : observedCounts).toBe(undefined);
          expect(run).toHaveBeenCalledTimes(runValues.length);
          expect(handleResult).toHaveBeenCalledTimes(runValues.length);
        },
      ),
      {
        plugins: [
          fc.beforeEach(() => {
            const counter = startMicroTasksCounter();
            getCount = counter.getCount;
            return () => {
              counter.stop();
            };
          }),
        ],
      },
    );
  });
});

// Helpers

function startMicroTasksCounter() {
  let stopMicroTasksCount = false;
  let microTasksCount = 0;
  function queueNext() {
    if (stopMicroTasksCount) {
      return;
    }
    microTasksCount += 1;
    Promise.resolve().then(queueNext);
  }
  queueNext();
  return {
    getCount: () => microTasksCount,
    stop: () => (stopMicroTasksCount = true),
  };
}
