import { MaybeMocked } from 'ts-jest/dist/utils/testing';
import { Random } from '../../../../../src/random/generator/Random';

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

  return {
    instance: new MyRandom({} as any),
    clone,
    next,
    nextBoolean,
    nextInt,
    nextBigInt,
    nextArrayInt,
    nextDouble,
  };
}
