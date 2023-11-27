import { beforeEach, describe, it, expect, vi } from 'vitest';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { TimeoutProperty } from '../../../../src/check/property/TimeoutProperty';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers';
import { fakeProperty } from './__test-helpers__/PropertyHelpers';

describe('TimeoutProperty', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('should forward calls to generate', () => {
    // Arrange
    vi.useFakeTimers();
    const { instance: decoratedProperty, generate } = fakeProperty(true);
    const { instance: mrng } = fakeRandom();
    const expectedRunId = 42;
    const expectedOut = new Value(Symbol('value'), Symbol('context'));
    generate.mockReturnValueOnce(expectedOut);

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100, setTimeout, clearTimeout);
    const out = timeoutProp.generate(mrng, expectedRunId);

    // Assert
    expect(out).toBe(expectedOut);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(mrng, expectedRunId);
  });

  it('should forward inputs to run', async () => {
    // Arrange
    vi.useFakeTimers();
    const { instance: decoratedProperty, run, runBeforeEach, runAfterEach } = fakeProperty(true);
    const expectedRunInput = { anything: Symbol('something') };

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10, setTimeout, clearTimeout);
    await timeoutProp.runBeforeEach();
    const runPromise = timeoutProp.run(expectedRunInput);
    vi.advanceTimersByTime(10);
    await runPromise;
    await timeoutProp.runAfterEach();

    // Assert
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(expectedRunInput);
    expect(runBeforeEach).toHaveBeenCalledTimes(1);
    expect(runAfterEach).toHaveBeenCalledTimes(1);
  });

  it('should not timeout if it succeeds in time', async () => {
    // Arrange
    vi.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(null), 10);
      }),
    );

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100, setTimeout, clearTimeout);
    await timeoutProp.runBeforeEach();
    const runPromise = timeoutProp.run({});
    vi.advanceTimersByTime(10);
    await runPromise;
    await timeoutProp.runAfterEach();

    // Assert
    expect(await runPromise).toBe(null);
  });

  it('should not timeout if it succeeds in time while timeout in beforeEach', async () => {
    // Arrange
    vi.useFakeTimers();
    const { instance: decoratedProperty, runBeforeEach } = fakeProperty(true);
    runBeforeEach.mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(), 100);
      }),
    );

    // Act / After
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10, setTimeout, clearTimeout);
    const beforeEachPromise = timeoutProp.runBeforeEach();
    vi.advanceTimersByTime(100);
    await beforeEachPromise;
    await timeoutProp.run({});
    await timeoutProp.runAfterEach();
  });

  it('should not timeout if it succeeds in time while timeout in afterEach', async () => {
    // Arrange
    vi.useFakeTimers();
    const { instance: decoratedProperty, runAfterEach } = fakeProperty(true);
    runAfterEach.mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(), 100);
      }),
    );

    // Act / Assert
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10, setTimeout, clearTimeout);
    await timeoutProp.runBeforeEach();
    await timeoutProp.run({});
    const afterEachPromise = timeoutProp.runAfterEach();
    vi.advanceTimersByTime(100);
    await afterEachPromise;
  });

  it('should not timeout if it fails in time', async () => {
    // Arrange
    const errorFromUnderlying = { error: new Error('plop') };
    vi.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(
      new Promise(function (resolve) {
        // underlying property is not supposed to throw (reject)
        setTimeout(() => resolve(errorFromUnderlying), 10);
      }),
    );

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100, setTimeout, clearTimeout);
    await timeoutProp.runBeforeEach();
    const runPromise = timeoutProp.run({});
    vi.advanceTimersByTime(10);
    await runPromise;
    await timeoutProp.runAfterEach();

    // Assert
    expect(await runPromise).toBe(errorFromUnderlying);
  });

  it('should clear all started timeouts on success', async () => {
    // Arrange
    vi.useFakeTimers();
    vi.spyOn(global, 'setTimeout');
    vi.spyOn(global, 'clearTimeout');
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockResolvedValueOnce(null);

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100, setTimeout, clearTimeout);
    await timeoutProp.runBeforeEach();
    await timeoutProp.run({});
    await timeoutProp.runAfterEach();

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
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockResolvedValueOnce(errorFromUnderlying);

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100, setTimeout, clearTimeout);
    await timeoutProp.runBeforeEach();
    await timeoutProp.run({});
    await timeoutProp.runAfterEach();

    // Assert
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it('should timeout if it takes to long', async () => {
    // Arrange
    vi.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(null), 100);
      }),
    );

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10, setTimeout, clearTimeout);
    await timeoutProp.runBeforeEach();
    const runPromise = timeoutProp.run({});
    vi.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual({ error: new Error(`Property timeout: exceeded limit of 10 milliseconds`) });
    await timeoutProp.runAfterEach();
  });

  it('Should timeout if it never ends', async () => {
    // Arrange
    vi.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(new Promise(() => {}));

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10, setTimeout, clearTimeout);
    await timeoutProp.runBeforeEach();
    const runPromise = timeoutProp.run({});
    vi.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual({ error: new Error(`Property timeout: exceeded limit of 10 milliseconds`) });
    await timeoutProp.runAfterEach();
  });
});
