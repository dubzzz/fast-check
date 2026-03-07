import { vi } from 'vitest';
import type { Random } from '../../../../src/random/generator/Random.js';
import * as RandomModule from '../../../../src/random/generator/Random.js';

export function fakeRandom(): { instance: Random } & {
  clone: ReturnType<typeof vi.fn>;
  next: ReturnType<typeof vi.fn>;
  jump: ReturnType<typeof vi.fn>;
  getState: ReturnType<typeof vi.fn>;
} {
  const clone = vi.fn();
  const next = vi.fn();
  const jump = vi.fn();
  const getState = vi.fn();

  const instance: Random = {
    clone,
    next,
    jump,
    getState,
  };

  clone.mockReturnValue(instance);

  return { instance, clone, next, jump, getState };
}

/**
 * Mock the `nextInt` function from the Random module.
 * Returns the mock so tests can control returned values.
 */
export function mockNextInt(): ReturnType<typeof vi.fn> {
  const mock = vi.fn();
  vi.spyOn(RandomModule, 'nextInt').mockImplementation(mock);
  return mock;
}

/**
 * Mock the `nextBigInt` function from the Random module.
 * Returns the mock so tests can control returned values.
 */
export function mockNextBigInt(): ReturnType<typeof vi.fn> {
  const mock = vi.fn();
  vi.spyOn(RandomModule, 'nextBigInt').mockImplementation(mock);
  return mock;
}
