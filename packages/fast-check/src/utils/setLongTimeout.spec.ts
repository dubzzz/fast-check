import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const maxTimerDelay = 0x7fffffff;

describe('setLongTimeout', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    { delay: 10, chunks: [10] },
    { delay: maxTimerDelay, chunks: [maxTimerDelay] },
    { delay: maxTimerDelay + 1, chunks: [maxTimerDelay, 1] },
    { delay: 2 * maxTimerDelay, chunks: [maxTimerDelay, maxTimerDelay] },
    { delay: 2 * maxTimerDelay + 17, chunks: [maxTimerDelay, maxTimerDelay, 17] },
  ])('should fire once after $delay ms', async ({ delay, chunks }) => {
    // Arrange
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    const { setLongTimeout } = await import('./setLongTimeout.js');
    const callback = vi.fn();

    // Act
    setLongTimeout(callback, delay);
    vi.advanceTimersByTime(delay - 1);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    // Assert
    expect(schedule.mock.calls.map(([, ms]) => ms)).toEqual(chunks);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    { delay: 10, interruptTime: 0, chunks: [10] },
    { delay: maxTimerDelay, interruptTime: maxTimerDelay - 1, chunks: [maxTimerDelay] },
    { delay: 2 * maxTimerDelay + 17, interruptTime: maxTimerDelay - 1, chunks: [maxTimerDelay] },
    { delay: 2 * maxTimerDelay + 17, interruptTime: maxTimerDelay, chunks: [maxTimerDelay, maxTimerDelay] },
    {
      delay: 2 * maxTimerDelay + 17,
      interruptTime: 2 * maxTimerDelay + 16,
      chunks: [maxTimerDelay, maxTimerDelay, 17],
    },
    { delay: Infinity, interruptTime: maxTimerDelay, chunks: [] },
  ])('should cancel a $delay ms timeout at $interruptTime ms', async ({ delay, interruptTime, chunks }) => {
    // Arrange
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    const { setLongTimeout } = await import('./setLongTimeout.js');
    const callback = vi.fn();

    // Act
    const clear = setLongTimeout(callback, delay);
    vi.advanceTimersByTime(interruptTime);
    clear();

    // Assert
    expect(vi.getTimerCount()).toBe(0);
    expect(callback).not.toHaveBeenCalled();
    expect(schedule.mock.calls.map(([, ms]) => ms)).toEqual(chunks);
  });
});
