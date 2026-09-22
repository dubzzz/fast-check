import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { Property } from '../property/types/Property.js';

describe('TimeoutPlugin', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should forward inputs to run', async () => {
    // Arrange
    const nestedRun = vi.fn<Property<unknown>['run']>().mockResolvedValueOnce(null);
    const expectedRunInput = { anything: Symbol('something') };

    // Act
    const finalRun = await timeoutPluginRun(10, nestedRun);
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
    const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(output), 10);
      }),
    );

    // Act
    const finalRun = await timeoutPluginRun(100, nestedRun);
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
    vi.spyOn(global, 'setTimeout');
    vi.spyOn(global, 'clearTimeout');
    const nestedRun = vi.fn<Property<unknown>['run']>().mockResolvedValueOnce(output);

    // Act
    const finalRun = await timeoutPluginRun(100, nestedRun);
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
    const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValueOnce(buildNestedRunPromise());

    // Act
    const finalRun = await timeoutPluginRun(10, nestedRun);
    const runPromise = finalRun({});
    vi.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual({ error: new Error(`Property timeout: exceeded limit of 10 milliseconds`) });
  });

  it.each([
    { outcome: 'success', output: null },
    { outcome: 'failure', output: { error: new Error('plop') } },
    { outcome: 'precondition failure', output: new PreconditionFailure() },
  ])('should preserve synchronous runs untouched and clear the started timeout on $outcome', async ({ output }) => {
    // Arrange
    vi.spyOn(global, 'setTimeout');
    vi.spyOn(global, 'clearTimeout');
    const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValueOnce(output);

    // Act
    const finalRun = await timeoutPluginRun(100, nestedRun);
    const out = finalRun({});

    // Assert
    expect(out).toBe(output); // sync run, sync output: nothing to race against the timeout
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });
});

// Helpers

async function timeoutPluginRun(timeMs: number, nestedRun: Property<unknown>['run']) {
  const { timeout } = await import('./TimeoutPlugin.js');
  const instance = timeout(timeMs)(0, new Map<symbol, any>());
  return instance.decorateRun!(nestedRun);
}
