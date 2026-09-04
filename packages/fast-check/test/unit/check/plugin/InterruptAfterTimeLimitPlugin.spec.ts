import { beforeEach, describe, expect, it, vi } from 'vitest';
import { interruptAfterTimeLimit } from '../../../../src/check/plugin/InterruptAfterTimeLimitPlugin.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';

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
      const finalRun = timeLimitPluginRun(100, nestedRun);
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
      const finalRun = timeLimitPluginRun(100, nestedRun);
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
      const finalRun = timeLimitPluginRun(10, nestedRun);
      const runPromise = finalRun({});
      vi.advanceTimersByTime(10);

      // Assert
      const out = await runPromise;
      expect(nestedRun).toHaveBeenCalledTimes(1);
      expect(PreconditionFailure.isFailure(out)).toBe(true);
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
    });

    it.each([
      { name: 'success', runOutput: null },
      { name: 'precondition failure', runOutput: new PreconditionFailure() },
      { name: 'failure', runOutput: { error: new Error('plop') } },
      { name: 'async success', runOutput: Promise.resolve(null) },
      { name: 'async precondition failure', runOutput: Promise.resolve(new PreconditionFailure()) },
      { name: 'async failure', runOutput: Promise.resolve({ error: new Error('plop') }) },
    ])('should clear all started timeouts on $name', async ({ runOutput }) => {
      // Arrange
      vi.useFakeTimers();
      vi.spyOn(global, 'setTimeout');
      vi.spyOn(global, 'clearTimeout');
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>(() => runOutput);

      // Act
      const finalRun = timeLimitPluginRun(100, nestedRun);
      await finalRun({});

      // Assert
      expect(setTimeout).toBeCalledTimes(1);
      expect(clearTimeout).toBeCalledTimes(1);
    });
  });
});

// Helpers

function timeLimitPluginRun(timeLimitMs: number, nestedRun: IRawProperty<unknown, boolean>['run']) {
  const instance = interruptAfterTimeLimit(timeLimitMs)(0, new Map<symbol, any>());
  return instance.decorateRun!(nestedRun);
}
