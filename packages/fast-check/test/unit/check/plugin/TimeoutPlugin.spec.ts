import { beforeEach, describe, expect, it, vi } from 'vitest';
import { timeout } from '../../../../src/check/plugin/TimeoutPlugin.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';

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

  it.each([
    { outcome: 'succeeds', output: null },
    { outcome: 'fails', output: { error: new Error('plop') } },
    { outcome: 'skips on precondition', output: new PreconditionFailure() },
  ])('should not timeout if it $outcome in time', async ({ output }) => {
    // Arrange
    vi.useFakeTimers();
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(output), 10);
      }),
    );

    // Act
    const finalRun = timeoutPluginRun(100, nestedRun);
    const runPromise = finalRun({});
    vi.advanceTimersByTime(10);
    await runPromise;

    // Assert
    expect(await runPromise).toBe(output);
  });

  it.each([
    { outcome: 'success', output: null },
    { outcome: 'failure', output: { error: new Error('plop') } },
    { outcome: 'precondition failure', output: new PreconditionFailure() },
  ])('should clear all started timeouts on $outcome', async ({ output }) => {
    // Arrange
    vi.useFakeTimers();
    vi.spyOn(global, 'setTimeout');
    vi.spyOn(global, 'clearTimeout');
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockResolvedValueOnce(output);

    // Act
    const finalRun = timeoutPluginRun(100, nestedRun);
    await finalRun({});

    // Assert
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it.each([
    {
      behavior: 'takes too long',
      buildNestedRunPromise: () => new Promise<null>((resolve) => setTimeout(() => resolve(null), 100)),
    },
    {
      behavior: 'never ends',
      buildNestedRunPromise: () => new Promise<null>(() => {}),
    },
  ])('should timeout if it $behavior', async ({ buildNestedRunPromise }) => {
    // Arrange
    vi.useFakeTimers();
    const nestedRun = vi.fn<IRawProperty<unknown, boolean>['run']>().mockReturnValueOnce(buildNestedRunPromise());

    // Act
    const finalRun = timeoutPluginRun(10, nestedRun);
    const runPromise = finalRun({});
    vi.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual({ error: new Error(`Property timeout: exceeded limit of 10 milliseconds`) });
  });
});

// Helpers

function timeoutPluginRun(timeMs: number, nestedRun: IRawProperty<unknown, boolean>['run']) {
  const instance = timeout(timeMs)(0, new Map<symbol, any>());
  return instance.decorateRun!(nestedRun);
}
