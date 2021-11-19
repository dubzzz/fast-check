import { MaybeMocked } from 'ts-jest/dist/utils/testing';
import { Random } from '../../../../src/random/generator/Random';

export function fakeRandom(): { instance: Random } & Omit<MaybeMocked<Random>, 'internalRng' | 'uniformIn'> {
  const clone = jest.fn();
  const next = jest.fn();
  const nextBoolean = jest.fn();
  const nextInt = jest.fn();
  const nextBigInt = jest.fn();
  const nextArrayInt = jest.fn();
  const nextDouble = jest.fn();
  class MyRandom extends Random {
    clone = clone;
    next = next;
    nextBoolean = nextBoolean;
    nextInt = nextInt;
    nextBigInt = nextBigInt;
    nextArrayInt = nextArrayInt;
    nextDouble = nextDouble;
  }

  // Calling `new MyRandom` triggers a call to the default ctor of `Random`.
  // As we don't use anything from this base class, we just pass the ctor with a value that looks ok for it.
  const instance = new MyRandom({ clone: () => null } as any);
  return { instance, clone, next, nextBoolean, nextInt, nextBigInt, nextArrayInt, nextDouble };
}
