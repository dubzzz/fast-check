import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTimeoutPlugin, timeout } from '../../../../src/check/plugin/TimeoutPlugin.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';

describe('TimeoutPlugin', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('should forward inputs to run', async () => {
    // Arrange
    vi.useFakeTimers();
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockResolvedValueOnce(null);
    const expectedRunInput = { anything: Symbol('something') };

    // Act
    const finalRun = timeoutPluginRun(10, nestedRun);
    const runPromise = finalRun(expectedRunInput);
    vi.advanceTimersByTime(10);
    await runPromise;

    // Assert
    expect(nestedRun).toHaveBeenCalledTimes(1);
    expect(nestedRun).toHaveBeenCalledWith(expectedRunInput);
  });

  it('should not timeout if it succeeds in time', async () => {
    // Arrange
    vi.useFakeTimers();
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(null), 10);
      }),
    );

    // Act
    const finalRun = timeoutPluginRun(100, nestedRun);
    const runPromise = finalRun({});
    vi.advanceTimersByTime(10);
    await runPromise;

    // Assert
    expect(await runPromise).toBe(null);
  });

  it('should not timeout if it fails in time', async () => {
    // Arrange
    const errorFromUnderlying = { error: new Error('plop') };
    vi.useFakeTimers();
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(
      new Promise(function (resolve) {
        // underlying run is not supposed to throw (reject)
        setTimeout(() => resolve(errorFromUnderlying), 10);
      }),
    );

    // Act
    const finalRun = timeoutPluginRun(100, nestedRun);
    const runPromise = finalRun({});
    vi.advanceTimersByTime(10);
    await runPromise;

    // Assert
    expect(await runPromise).toBe(errorFromUnderlying);
  });

  it('should clear all started timeouts on success', async () => {
    // Arrange
    vi.useFakeTimers();
    vi.spyOn(global, 'setTimeout');
    vi.spyOn(global, 'clearTimeout');
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockResolvedValueOnce(null);

    // Act
    const finalRun = timeoutPluginRun(100, nestedRun);
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
    const finalRun = timeoutPluginRun(100, nestedRun);
    await finalRun({});

    // Assert
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it('should timeout if it takes to long', async () => {
    // Arrange
    vi.useFakeTimers();
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(null), 100);
      }),
    );

    // Act
    const finalRun = timeoutPluginRun(10, nestedRun);
    const runPromise = finalRun({});
    vi.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual({ error: new Error(`Property timeout: exceeded limit of 10 milliseconds`) });
  });

  it('should timeout if it never ends', async () => {
    // Arrange
    vi.useFakeTimers();
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(new Promise(() => {}));

    // Act
    const finalRun = timeoutPluginRun(10, nestedRun);
    const runPromise = finalRun({});
    vi.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual({ error: new Error(`Property timeout: exceeded limit of 10 milliseconds`) });
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
    const finalRun = timeoutPluginRun(100, nestedRun);
    const out = finalRun({});

    // Assert
    expect(out).toBe(runOutput); // sync run, sync output: nothing to race against the timeout
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it('should define one decorateRun per instance without merging with other instances', () => {
    // Arrange
    let pluginIndex = 0;
    const sharedContext = {};

    // Act
    const instanceA = timeout(10)(pluginIndex++, sharedContext);
    const instanceB = timeout(10)(pluginIndex++, sharedContext);

    // Assert
    expect(instanceA.decorateRun).not.toBe(undefined);
    expect(instanceB.decorateRun).not.toBe(undefined);
    expect(instanceB.decorateRun).not.toBe(instanceA.decorateRun);
  });

  it('should timeout with real timers when relying on the public plugin', async () => {
    // Arrange
    vi.useRealTimers();
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(new Promise(() => {}));
    const instance = timeout(10)(0, {});

    // Act
    const finalRun = instance.decorateRun!(nestedRun);

    // Assert
    expect(await finalRun({})).toEqual({ error: new Error(`Property timeout: exceeded limit of 10 milliseconds`) });
  });
});

// Helpers

function timeoutPluginRun(timeMs: number, nestedRun: IRawProperty<unknown, boolean>['run']) {
  const plugin = buildTimeoutPlugin(timeMs, setTimeout, clearTimeout);
  const instance = plugin(0, {});
  return instance.decorateRun!(nestedRun);
}
