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
    const executionContext = { signal: new AbortController().signal };

    // Act
    const finalRun = await timeoutPluginRun(10, nestedRun);
    const runPromise = finalRun(expectedRunInput, executionContext);
    vi.advanceTimersByTime(10);
    await runPromise;

    // Assert
    expect(nestedRun).toHaveBeenCalledTimes(1);
    expect(nestedRun).toHaveBeenCalledWith(
      expectedRunInput,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
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
    const runPromise = finalRun({}, {});
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
    await finalRun({}, {});

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
    const runPromise = finalRun({}, {});
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
    const out = finalRun({}, {});

    // Assert
    expect(out).toBe(output); // sync run, sync output: nothing to race against the timeout
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it('should abort the signal as soon as we reach the timeout and consider the run as failed even if it ended at the same time', async () => {
    // Arrange
    const timeoutError = new Error(`Property timeout: exceeded limit of 10 milliseconds`);
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
    const finalRun = await timeoutPluginRun(10, nestedRun);
    const runPromise = finalRun({}, {});
    vi.advanceTimersByTime(10);

    // Assert
    expect(nestedRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    const signal = nestedRun.mock.calls[0][1].signal!;
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toEqual(timeoutError);
    expect(await runPromise).toEqual({ error: timeoutError });
  });

  it.each([
    { outcome: 'success', output: null },
    { outcome: 'failure', output: { error: new Error('plop') } },
    { outcome: 'precondition failure', output: new PreconditionFailure() },
  ])(
    'should forward the original signal but not take it as a timeout as its handling should be the responsibility of the caller even on $outcome',
    async ({ output }) => {
      // Arrange
      const controller = new AbortController();
      const signalError = new Error(`The original signal aborted`);
      const nestedRun = vi.fn<Property<unknown>['run']>(
        (_, { signal }) =>
          new Promise((resolve) => {
            if (signal !== undefined) {
              const onAbort = () => {
                resolve(output); // success right when the signal rejects
                signal.removeEventListener('abort', onAbort);
              };
              signal.addEventListener('abort', onAbort);
            }
          }),
      );

      // Act
      const finalRun = await timeoutPluginRun(10, nestedRun);
      const runPromise = finalRun({}, { signal: controller.signal });
      controller.abort(signalError);

      // Assert
      expect(nestedRun).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      const signal = nestedRun.mock.calls[0][1].signal!;
      expect(signal.aborted).toBe(true);
      expect(signal.reason).toEqual(signalError);
      expect(await runPromise).toEqual(output); // same as the underying run
    },
  );

  it.each([
    { outcome: 'failure', output: { error: new Error('plop') } },
    { outcome: 'precondition failure', output: new PreconditionFailure() },
  ])(
    'should preserve the original $outcome without executing the predicate when the signal is already aborted',
    async ({ output }) => {
      // Arrange
      const controller = new AbortController();
      const signalError = 'error' in output ? output.error : output;
      const nestedRun = vi.fn<Property<unknown>['run']>();

      // Act
      controller.abort(signalError); // aborted before starting
      const finalRun = await timeoutPluginRun(10, nestedRun);
      const runPromise = finalRun({}, { signal: controller.signal });

      // Assert
      expect(nestedRun).not.toHaveBeenCalled();
      expect(await runPromise).toEqual(output); // forward the signal: error is error, precondition issue is precondition issue
    },
  );
});

// Helpers

async function timeoutPluginRun(timeMs: number, nestedRun: Property<unknown>['run']) {
  const { timeout } = await import('./TimeoutPlugin.js');
  const instance = timeout(timeMs)(0, new Map<symbol, any>());
  return instance.decorateRun!(nestedRun);
}
