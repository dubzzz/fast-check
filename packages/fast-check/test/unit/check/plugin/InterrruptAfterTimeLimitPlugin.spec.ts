import { beforeEach, describe, expect, it, vi } from 'vitest';
import { interruptAfterTimeLimit } from '../../../../src/check/plugin/InterrruptAfterTimeLimitPlugin.js';
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
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(null);
      const expectedRunInput = { anything: Symbol('something') };

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
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>();

      // Act
      const finalRun = timeLimitPluginRun(100, nestedRun);
      vi.advanceTimersByTime(100);
      const out = finalRun({});

      // Assert
      expect(nestedRun).not.toHaveBeenCalled();
      expect(PreconditionFailure.isFailure(out)).toBe(true);
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
    });

    it('should define one decorateRun per instance without merging with other instances', () => {
      // Arrange
      let pluginIndex = 0;
      const store = new Map<symbol, any>();

      // Act
      const instanceA = interruptAfterTimeLimit(10)(pluginIndex++, store);
      const instanceB = interruptAfterTimeLimit(10)(pluginIndex++, store);

      // Assert
      expect(instanceA.decorateRun).not.toBe(undefined);
      expect(instanceB.decorateRun).not.toBe(undefined);
      expect(instanceB.decorateRun).not.toBe(instanceA.decorateRun);
    });

    it('should interrupt long-running executions started within the time limit', async () => {
      // Arrange
      vi.useFakeTimers();
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(new Promise(() => {}));

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

    it('should clear all started timeouts on success', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.spyOn(global, 'setTimeout');
      vi.spyOn(global, 'clearTimeout');
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockResolvedValueOnce(null);

      // Act
      const finalRun = timeLimitPluginRun(100, nestedRun);
      await finalRun({});

      // Assert
      expect(setTimeout).toBeCalledTimes(1);
      expect(clearTimeout).toBeCalledTimes(1);
    });

    it('should clear all started timeouts on failure', async () => {
      // Arrange
      const errorFromUnderlying = { error: new Error('plop') };
      vi.useFakeTimers();
      vi.spyOn(global, 'setTimeout');
      vi.spyOn(global, 'clearTimeout');
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockResolvedValueOnce(errorFromUnderlying);

      // Act
      const finalRun = timeLimitPluginRun(100, nestedRun);
      await finalRun({});

      // Assert
      expect(setTimeout).toBeCalledTimes(1);
      expect(clearTimeout).toBeCalledTimes(1);
    });

    it.each([
      { name: 'success', runOutput: null },
      { name: 'precondition failure', runOutput: new PreconditionFailure() },
      { name: 'failure', runOutput: { error: new Error('plop') } },
    ])('should preserve synchronous runs untouched and clear the started timeout on $name', ({ runOutput }) => {
      // Arrange
      vi.useFakeTimers();
      vi.spyOn(global, 'setTimeout');
      vi.spyOn(global, 'clearTimeout');
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(runOutput);

      // Act
      const finalRun = timeLimitPluginRun(100, nestedRun);
      const out = finalRun({});

      // Assert
      expect(out).toBe(runOutput); // sync run, sync output: nothing to race against the interruption
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
