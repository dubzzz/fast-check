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
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    const { setLongTimeout } = await import('./setLongTimeout.js');
    const callback = vi.fn();

    setLongTimeout(callback, delay);
    vi.advanceTimersByTime(delay - 1);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(schedule.mock.calls.map(([, ms]) => ms)).toEqual(chunks);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, maxTimerDelay, 2 * maxTimerDelay])('should cancel the pending chunk at %s ms', async (elapsed) => {
    const { setLongTimeout } = await import('./setLongTimeout.js');
    const callback = vi.fn();
    const delay = 2 * maxTimerDelay + 17;

    const cancel = setLongTimeout(callback, delay);
    vi.advanceTimersByTime(elapsed);
    cancel();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(delay - elapsed);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should fire immediately if a late chunk wakes up past the deadline', async () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(0);
    const { setLongTimeout } = await import('./setLongTimeout.js');
    const callback = vi.fn();
    const delay = maxTimerDelay + 10;

    setLongTimeout(callback, delay);
    now.mockReturnValue(delay + 1);
    vi.advanceTimersByTime(maxTimerDelay);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should schedule no timer for Infinity', async () => {
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    const { setLongTimeout } = await import('./setLongTimeout.js');
    const callback = vi.fn();

    const cancel = setLongTimeout(callback, Infinity);
    expect(schedule).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2 * maxTimerDelay);
    cancel();
    expect(callback).not.toHaveBeenCalled();
  });
});
