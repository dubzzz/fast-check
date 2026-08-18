import { beforeEach, describe, expect, it, vi } from 'vitest';
import { interruptAfterTimeLimit, skipAllAfterTimeLimit } from '../../../../src/check/plugin/TimeLimitPlugins.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import type { Plugin } from '../../../../src/check/plugin/Plugin.js';

describe('TimeLimitPlugins', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  describe.each([
    { pluginName: 'skipAllAfterTimeLimit', factory: skipAllAfterTimeLimit, interrupts: false },
    { pluginName: 'interruptAfterTimeLimit', factory: interruptAfterTimeLimit, interrupts: true },
  ])('$pluginName', ({ factory, interrupts }) => {
    it('should forward inputs to run when started within the time limit', async () => {
      // Arrange
      vi.useFakeTimers();
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(null);
      const expectedRunInput = { anything: Symbol('something') };

      // Act
      const finalRun = timeLimitPluginRun(factory, 100, nestedRun);
      const out = finalRun(expectedRunInput);

      // Assert
      expect(out).toBe(null);
      expect(nestedRun).toHaveBeenCalledTimes(1);
      expect(nestedRun).toHaveBeenCalledWith(expectedRunInput);
    });

    it('should skip executions started after the time limit without calling run', () => {
      // Arrange
      vi.useFakeTimers();
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>();

      // Act
      const finalRun = timeLimitPluginRun(factory, 100, nestedRun);
      vi.advanceTimersByTime(100);
      const out = finalRun({});

      // Assert
      expect(nestedRun).not.toHaveBeenCalled();
      expect(PreconditionFailure.isFailure(out)).toBe(true);
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(interrupts);
    });

    it('should define one decorateRun per instance without merging with other instances', () => {
      // Arrange
      let pluginIndex = 0;
      const sharedContext = {};

      // Act
      const instanceA = factory(10)(pluginIndex++, sharedContext);
      const instanceB = factory(10)(pluginIndex++, sharedContext);

      // Assert
      expect(instanceA.decorateRun).not.toBe(undefined);
      expect(instanceB.decorateRun).not.toBe(undefined);
      expect(instanceB.decorateRun).not.toBe(instanceA.decorateRun);
    });
  });

  describe('skipAllAfterTimeLimit', () => {
    it('should never start any timer', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.spyOn(global, 'setTimeout');
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockResolvedValueOnce(null);

      // Act
      const finalRun = timeLimitPluginRun(skipAllAfterTimeLimit, 100, nestedRun);
      await finalRun({});

      // Assert
      expect(setTimeout).not.toHaveBeenCalled();
    });
  });

  describe('interruptAfterTimeLimit', () => {
    it('should interrupt long-running executions started within the time limit', async () => {
      // Arrange
      vi.useFakeTimers();
      const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(new Promise(() => {}));

      // Act
      const finalRun = timeLimitPluginRun(interruptAfterTimeLimit, 10, nestedRun);
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
      const finalRun = timeLimitPluginRun(interruptAfterTimeLimit, 100, nestedRun);
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
      const finalRun = timeLimitPluginRun(interruptAfterTimeLimit, 100, nestedRun);
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
      const finalRun = timeLimitPluginRun(interruptAfterTimeLimit, 100, nestedRun);
      const out = finalRun({});

      // Assert
      expect(out).toBe(runOutput); // sync run, sync output: nothing to race against the interruption
      expect(setTimeout).toBeCalledTimes(1);
      expect(clearTimeout).toBeCalledTimes(1);
    });
  });
});

// Helpers

function timeLimitPluginRun(
  factory: (timeLimitMs: number) => Plugin<unknown>,
  timeLimitMs: number,
  nestedRun: IRawProperty<unknown, boolean>['run'],
) {
  const instance = factory(timeLimitMs)(0, {});
  return instance.decorateRun!(nestedRun);
}
