import type { RandomGenerator as RandomGenerator8x } from 'pure-rand/types/RandomGenerator';
import type { JumpableRandomGenerator as JumpableRandomGenerator8x } from 'pure-rand/types/JumpableRandomGenerator';
import { skipN } from 'pure-rand/utils/skipN';

interface RandomGenerator7x {
  clone(): RandomGenerator7x;
  next(): [number, RandomGenerator7x];
  jump?(): RandomGenerator7x;
  unsafeNext(): number;
  unsafeJump?(): void;
  getState(): readonly number[];
}

export type RandomGenerator = RandomGenerator7x | RandomGenerator8x | JumpableRandomGenerator8x;

/** @internal */
export type RandomGeneratorInternal = JumpableRandomGenerator8x;

/** @internal */
function adaptRandomGeneratorTo8x(rng: RandomGenerator): RandomGenerator8x | JumpableRandomGenerator8x {
  if ('unsafeNext' in rng) {
    // 7.x generation
    if (rng.unsafeJump === undefined) {
      return {
        clone: () => adaptRandomGeneratorTo8x(rng),
        next: () => rng.unsafeNext(),
        getState: () => rng.getState(),
      };
    }
    return {
      clone: () => adaptRandomGeneratorTo8x(rng),
      next: () => rng.unsafeNext(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      jump: () => rng.unsafeJump!(),
      getState: () => rng.getState(),
    };
  }
  // 8.x generation
  return rng;
}

/** @internal */
function adaptRandomGeneratorToInternal(rng: RandomGenerator8x | JumpableRandomGenerator8x): RandomGeneratorInternal {
  if ('jump' in rng && typeof rng.jump === 'function') {
    return rng;
  }
  return {
    clone: () => adaptRandomGeneratorToInternal(rng),
    next: () => rng.next(),
    jump: () => skipN(rng, 42),
    getState: () => rng.getState(),
  };
}

/** @internal */
export function adaptRandomGenerator(rng: RandomGenerator): RandomGeneratorInternal {
  return adaptRandomGeneratorToInternal(adaptRandomGeneratorTo8x(rng));
}
