import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Property } from '../property/types/Property.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import { asyncToStringMethod } from '../../utils/stringify.js';
import { VerbosityLevel } from '../runner/configuration/VerbosityLevel.js';
import { ExecutionStatus } from '../runner/reporter/ExecutionStatus.js';
import type { RunDetails } from '../runner/reporter/RunDetails.js';

describe('TimeLimitPlugins', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('interruptAfterTimeLimit', () => {
    it.each([false, true])(
      'should report an interruption without a cause (async formatting: %s)',
      async (asynchronous) => {
        const { interruptAfterTimeLimit } = await import('./InterruptAfterTimeLimitPlugin.js');
        const instance = interruptAfterTimeLimit(-1, { failOnInterrupt: true })(0, new Map());
        instance.decorateRun!(() => null)(42, {});
        const value = asynchronous ? { [asyncToStringMethod]: async () => 'custom value' } : 42;
        const details: RunDetails<unknown> = {
          failed: false,
          interrupted: true,
          numRuns: 1,
          numSkips: 0,
          numShrinks: 0,
          seed: 42,
          counterexample: null,
          counterexamplePath: null,
          errorInstance: null,
          failures: [],
          executionSummary: [{ status: ExecutionStatus.Success, value, children: [] }],
          verbose: VerbosityLevel.VeryVerbose,
          runConfiguration: {},
        };

        const error = await Promise.resolve()
          .then(() => instance.onAllRunsComplete!(details))
          .catch((err: unknown) => err);

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Property interrupted after 1 tests');
        expect(error).not.toHaveProperty('cause');
      },
    );

    it('should forward inputs to run when started within the time limit', async () => {
      // Arrange
      const { interruptAfterTimeLimit } = await import('./InterruptAfterTimeLimitPlugin.js');
      const nestedRun = vi.fn<Property<unknown>['run']>(() => null);
      const expectedRunInput = Symbol('something');
      const executionContext = { signal: new AbortController().signal };

      // Act
      const instance = interruptAfterTimeLimit(100)(0, new Map<symbol, any>());
      const finalRun = instance.decorateRun!(nestedRun);
      const out = finalRun(expectedRunInput, executionContext);

      // Assert
      expect(out).toBe(null);
      expect(nestedRun).toHaveBeenCalledTimes(1);
      expect(nestedRun).toHaveBeenCalledWith(
        expectedRunInput,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('should interrupt executions started after the time limit without calling run', async () => {
      // Arrange
      const { interruptAfterTimeLimit } = await import('./InterruptAfterTimeLimitPlugin.js');
      const nestedRun = vi.fn<Property<unknown>['run']>(() => null);

      // Act
      const instance = interruptAfterTimeLimit(100)(0, new Map<symbol, any>());
      const finalRun = instance.decorateRun!(nestedRun);
      vi.advanceTimersByTime(100);
      const out = finalRun({}, {});

      // Assert
      expect(nestedRun).not.toHaveBeenCalled();
      expect(PreconditionFailure.isFailure(out)).toBe(true);
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
    });

    it('should interrupt long-running executions started within the time limit', async () => {
      // Arrange
      const { interruptAfterTimeLimit } = await import('./InterruptAfterTimeLimitPlugin.js');
      const nestedRun = vi.fn<Property<unknown>['run']>(() => new Promise(() => {}));

      // Act
      const instance = interruptAfterTimeLimit(10)(0, new Map<symbol, any>());
      const finalRun = instance.decorateRun!(nestedRun);
      const runPromise = finalRun({}, {});
      vi.advanceTimersByTime(10);

      // Assert
      const out = await runPromise;
      expect(nestedRun).toHaveBeenCalledTimes(1);
      expect(PreconditionFailure.isFailure(out)).toBe(true);
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
    });

    it.each([
      { name: 'success', runOutput: null, numRuns: 10 },
      { name: 'precondition failure', runOutput: new PreconditionFailure(), numRuns: 10 },
      { name: 'failure', runOutput: { error: new Error('plop') }, numRuns: 10 },
      { name: 'async success', runOutput: Promise.resolve(null), numRuns: 10 },
      { name: 'async precondition failure', runOutput: Promise.resolve(new PreconditionFailure()), numRuns: 10 },
      { name: 'async failure', runOutput: Promise.resolve({ error: new Error('plop') }), numRuns: 10 },
    ])(
      'should clear the single timeout once done with all runs on $name (numRuns: $numRuns)',
      async ({ runOutput, numRuns }) => {
        // Arrange
        vi.spyOn(global, 'setTimeout');
        vi.spyOn(global, 'clearTimeout');
        const { interruptAfterTimeLimit } = await import('./InterruptAfterTimeLimitPlugin.js');
        const nestedRun = vi.fn<Property<unknown>['run']>(() => runOutput);

        // Act
        const instance = interruptAfterTimeLimit(100)(0, new Map<symbol, any>());
        const finalRun = instance.decorateRun!(nestedRun);
        for (let i = 0; i !== numRuns; ++i) {
          await finalRun({}, {});
        }
        await instance.onAllRunsComplete!({} as RunDetails<unknown>);

        // Assert
        expect(setTimeout).toBeCalledTimes(1); // only one timer for al runs
        expect(clearTimeout).toBeCalledTimes(1);
      },
    );

    it('should abort the signal as soon as we reach the time limit and consider the run as interrupted even if it ended at the same time', async () => {
      // Arrange
      const { interruptAfterTimeLimit } = await import('./InterruptAfterTimeLimitPlugin.js');
      const nestedRun = vi.fn<Property<unknown>['run']>(
        (_, { signal }) =>
          new Promise<null>((resolve) => {
            if (signal !== undefined) {
              const onAbort = () => {
                resolve(null);
                signal.removeEventListener('abort', onAbort);
              };
              signal.addEventListener('abort', onAbort);
            }
          }),
      );

      // Act
      const instance = interruptAfterTimeLimit(10)(0, new Map<symbol, any>());
      const finalRun = instance.decorateRun!(nestedRun);
      const runPromise = finalRun({}, {});
      vi.advanceTimersByTime(10);

      // Assert
      expect(nestedRun).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      const signal = nestedRun.mock.calls[0][1].signal!;
      expect(signal.aborted).toBe(true);
      expect(PreconditionFailure.isFailure(signal.reason)).toBe(true);
      expect(signal.reason.interruptExecution).toBe(true);
      expect(await runPromise).toBe(signal.reason);
    });

    it.each([
      { outcome: 'failure', output: { error: new Error('plop') } },
      { outcome: 'precondition failure', output: new PreconditionFailure() },
    ])(
      'should abort with $outcome from the original signal when it aborts before the time limit expires',
      async ({ output }) => {
        // Arrange
        const { interruptAfterTimeLimit } = await import('./InterruptAfterTimeLimitPlugin.js');
        const controller = new AbortController();
        const signalError = 'error' in output ? output.error : output;
        const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValueOnce(
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 100); // predicate completes after 100 ms but ignores signals
          }),
        );
        setTimeout(() => controller.abort(signalError), 10); // original signal aborts after 10 ms

        // Act
        const instance = interruptAfterTimeLimit(1000)(0, new Map<symbol, any>());
        const finalRun = instance.decorateRun!(nestedRun);
        const runPromise = finalRun({}, { signal: controller.signal });
        vi.advanceTimersByTime(10); // trigger the original signal before the predicate completes or the time limit expires

        // Assert
        expect(nestedRun).toHaveBeenCalledTimes(1);
        expect(await runPromise).toEqual(output);
      },
    );

    it.each([
      { outcome: 'failure', output: { error: new Error('plop') } },
      { outcome: 'precondition failure', output: new PreconditionFailure() },
    ])(
      'should preserve the original $outcome without executing the predicate when the signal is already aborted',
      async ({ output }) => {
        // Arrange
        const { interruptAfterTimeLimit } = await import('./InterruptAfterTimeLimitPlugin.js');
        const controller = new AbortController();
        const signalError = 'error' in output ? output.error : output;
        const nestedRun = vi.fn<Property<unknown>['run']>();

        // Act
        controller.abort(signalError);
        const instance = interruptAfterTimeLimit(10)(0, new Map<symbol, any>());
        const finalRun = instance.decorateRun!(nestedRun);
        const runPromise = finalRun({}, { signal: controller.signal });

        // Assert
        expect(nestedRun).not.toHaveBeenCalled();
        expect(await runPromise).toEqual(output);
      },
    );
  });
});
