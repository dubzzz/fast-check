import { describe, it, expect, vi } from 'vitest';
import { SkipAfterProperty } from '../../../../src/check/property/SkipAfterProperty';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { fakeProperty } from './__test-helpers__/PropertyHelpers';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers';
import { Value } from '../../../../src/check/arbitrary/definition/Value';

const startTimeMs = 200;
const timeLimitMs = 100;

describe('SkipAfterProperty', () => {
  it('should call timer at construction', async () => {
    // Arrange
    const timerMock = vi.fn();
    const { instance: decoratedProperty } = fakeProperty();

    // Act
    new SkipAfterProperty(decoratedProperty, timerMock, 0, false, setTimeout, clearTimeout);

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(1);
  });

  it('should not call timer on isAsync but forward call', async () => {
    // Arrange
    const timerMock = vi.fn();
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false, setTimeout, clearTimeout);
    p.isAsync();

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(1);
    expect(isAsync).toHaveBeenCalledTimes(1);
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(runAfterEach).not.toHaveBeenCalled();
  });

  it('should not call timer on generate but forward call', async () => {
    // Arrange
    const timerMock = vi.fn();
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();
    const { instance: mrng } = fakeRandom();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false, setTimeout, clearTimeout);
    p.generate(mrng, 123);

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(1);
    expect(isAsync).not.toHaveBeenCalled();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(runAfterEach).not.toHaveBeenCalled();
  });

  it('should not call timer on shrink but forward call', async () => {
    // Arrange
    const timerMock = vi.fn();
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false, setTimeout, clearTimeout);
    p.shrink(new Value(Symbol('value'), Symbol('context')));

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(1);
    expect(isAsync).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).toHaveBeenCalledTimes(1);
    expect(run).not.toHaveBeenCalled();
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(runAfterEach).not.toHaveBeenCalled();
  });

  it('should call timer on run and forward call if ok', () => {
    // Arrange
    const timerMock = vi.fn();
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false, setTimeout, clearTimeout);
    p.runBeforeEach();
    p.run(Symbol('value'));
    p.runAfterEach();

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(2);
    expect(isAsync).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
    expect(runBeforeEach).toHaveBeenCalledTimes(1);
    expect(runAfterEach).toHaveBeenCalledTimes(1);
  });

  it('should call timer on run and fail after time limit', () => {
    // Arrange
    const timerMock = vi
      .fn()
      .mockReturnValueOnce(startTimeMs)
      .mockReturnValueOnce(startTimeMs + timeLimitMs);
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false, setTimeout, clearTimeout);
    p.runBeforeEach();
    const out = p.run(Symbol('value'));
    p.runAfterEach();

    // Assert
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(timerMock).toHaveBeenCalledTimes(2);
    expect(isAsync).toHaveBeenCalledTimes(1); // check expected return type: return a resolved Promise if async, a value otherwise
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    // We may not want to run hooks in such context, but so far we do
    expect(runBeforeEach).toHaveBeenCalledTimes(1);
    expect(runAfterEach).toHaveBeenCalledTimes(1);
  });

  it('should forward falsy interrupt flag to the precondition failure', async () => {
    // Arrange
    const timerMock = vi
      .fn()
      .mockReturnValueOnce(startTimeMs)
      .mockReturnValueOnce(startTimeMs + timeLimitMs);
    const { instance: decoratedProperty } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false, setTimeout, clearTimeout);
    p.runBeforeEach();
    const out = p.run(Symbol('value'));
    p.runAfterEach();

    // Assert
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(false);
  });

  it('should forward truthy interrupt flag to the precondition failure', () => {
    // Arrange
    const timerMock = vi
      .fn()
      .mockReturnValueOnce(startTimeMs)
      .mockReturnValueOnce(startTimeMs + timeLimitMs);
    const { instance: decoratedProperty } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, true, setTimeout, clearTimeout);
    p.runBeforeEach();
    const out = p.run(Symbol('value'));
    p.runAfterEach();

    // Assert
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
  });

  describe('timeout', () => {
    it('should clear all started timeouts on success', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.spyOn(global, 'setTimeout');
      vi.spyOn(global, 'clearTimeout');
      const { instance: decoratedProperty, run } = fakeProperty(true);
      run.mockResolvedValueOnce(null);

      // Act
      const timeoutProp = new SkipAfterProperty(decoratedProperty, Date.now, 10, true, setTimeout, clearTimeout);
      await timeoutProp.runBeforeEach();
      await timeoutProp.run({});
      await timeoutProp.runAfterEach();

      // Assert
      expect(setTimeout).toBeCalledTimes(1);
      expect(clearTimeout).toBeCalledTimes(1);
    });

    it('should clear all started timeouts on failure', async () => {
      // Arrange
      const errorFromUnderlying = { error: undefined, errorMessage: 'plop' };
      vi.useFakeTimers();
      vi.spyOn(global, 'setTimeout');
      vi.spyOn(global, 'clearTimeout');
      const { instance: decoratedProperty, run } = fakeProperty(true);
      run.mockResolvedValueOnce(errorFromUnderlying);

      // Act
      const timeoutProp = new SkipAfterProperty(decoratedProperty, Date.now, 10, true, setTimeout, clearTimeout);
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
      const timeoutProp = new SkipAfterProperty(decoratedProperty, Date.now, 10, true, setTimeout, clearTimeout);
      await timeoutProp.runBeforeEach();
      const runPromise = timeoutProp.run({});
      vi.advanceTimersByTime(10);

      // Assert
      const out = await runPromise;
      expect(PreconditionFailure.isFailure(out)).toBe(true);
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
      await timeoutProp.runAfterEach();
    });
  });
});
