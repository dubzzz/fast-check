import { vi } from 'vitest';
import type { MaybeMocked } from '../../__test-helpers__/Mocked.js';
import { Random } from '../../../../src/random/generator/Random.js';

export function fakeRandom(): { instance: Random } & Omit<MaybeMocked<Random>, 'internalRng' | 'uniformIn'> {
  const clone = vi.fn();
  const next = vi.fn();
  const nextBoolean = vi.fn();
  const nextInt = vi.fn();
  const nextBigInt = vi.fn();
  const nextDouble = vi.fn();
  const getState = vi.fn();
  class MyRandom extends Random {
    clone = clone;
    next = next;
    nextBoolean = nextBoolean;
    nextInt = nextInt;
    nextBigInt = nextBigInt;
    getState = getState;
  }

  // Calling `new MyRandom` triggers a call to the default ctor of `Random`.
  // As we don't use anything from this base class, we just pass the ctor with a value that looks ok for it.
  const instance = new MyRandom({ clone: () => null } as any);
  return { instance, clone, next, nextBoolean, nextInt, nextBigInt, nextDouble, getState };
}
