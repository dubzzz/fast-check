import type { RandomGenerator as RandomGenerator8x } from 'pure-rand/types/RandomGenerator';
import type { JumpableRandomGenerator as JumpableRandomGenerator8x } from 'pure-rand/types/JumpableRandomGenerator';

interface RandomGenerator7x {
  clone(): RandomGenerator7x;
  next(): [number, RandomGenerator7x];
  jump?(): RandomGenerator7x;
  unsafeNext(): number;
  unsafeJump?(): void;
  getState(): readonly number[];
}

export type RandomGenerator = RandomGenerator7x | RandomGenerator8x | JumpableRandomGenerator8x;
export type RandomGeneratorInternal = RandomGenerator8x | JumpableRandomGenerator8x;

/** @internal */
export function adaptRandomGeneratorTo8x(rng: RandomGenerator): RandomGeneratorInternal {
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
