import { beforeEach, describe, expect, it, vi } from 'vitest';
import { interruptAfterTimeLimit } from '../../../../src/check/plugin/InterruptAfterTimeLimitPlugin.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import type { RunDetails } from '../../../../src/check/runner/reporter/RunDetails.js';

describe('TimeLimitPlugins', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  describe('interruptAfterTimeLimit', () => {
    it('should forward inputs to run when started within the time limit', () => {
      // Arrange
      vi.useFakeTimers();
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>(() => null);
      const expectedRunInput = Symbol('something');

      // Act
      const instance = interruptAfterTimeLimit(100)(0, new Map<symbol, any>());
      const finalRun = instance.decorateRun!(nestedRun);
      const out = finalRun(expectedRunInput);

      // Assert
      expect(out).toBe(null);
      expect(nestedRun).toHaveBeenCalledTimes(1);
      expect(nestedRun).toHaveBeenCalledWith(expectedRunInput);
    });

    it('should interrupt executions started after the time limit without calling run', () => {
      // Arrange
      vi.useFakeTimers();
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>(() => null);

      // Act
      const instance = interruptAfterTimeLimit(100)(0, new Map<symbol, any>());
      const finalRun = instance.decorateRun!(nestedRun);
      vi.advanceTimersByTime(100);
      const out = finalRun({});

      // Assert
      expect(nestedRun).not.toHaveBeenCalled();
      expect(PreconditionFailure.isFailure(out)).toBe(true);
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
    });

    it('should interrupt long-running executions started within the time limit', async () => {
      // Arrange
      vi.useFakeTimers();
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>(() => new Promise(() => {}));

      // Act
      const instance = interruptAfterTimeLimit(10)(0, new Map<symbol, any>());
      const finalRun = instance.decorateRun!(nestedRun);
      const runPromise = finalRun({});
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
        vi.useFakeTimers();
        vi.spyOn(global, 'setTimeout');
        vi.spyOn(global, 'clearTimeout');
        const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>(() => runOutput);

        // Act
        const instance = interruptAfterTimeLimit(100)(0, new Map<symbol, any>());
        const finalRun = instance.decorateRun!(nestedRun);
        for (let i = 0; i !== numRuns; ++i) {
          await finalRun({});
        }
        await instance.onAllRunsComplete!({} as RunDetails<unknown>);

        // Assert
        expect(setTimeout).toBeCalledTimes(1); // only one timer for al runs
        expect(clearTimeout).toBeCalledTimes(1);
      },
    );
  });
});
