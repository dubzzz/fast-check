import type { JumpableRandomGenerator } from 'pure-rand/types/JumpableRandomGenerator';
import { uniformBigInt } from 'pure-rand/distribution/uniformBigInt';
import { uniformInt } from 'pure-rand/distribution/uniformInt';
import { adaptRandomGenerator } from './RandomGenerator.js';
import type { RandomGenerator } from './RandomGenerator.js';

/**
 * Type alias for pure-rand's JumpableRandomGenerator
 *
 * @remarks Since 4.6.0
 * @public
 */
export type Random = JumpableRandomGenerator;

/**
 * Create a mutable random number generator by cloning the passed one
 * @param sourceRng - Random generator, will not be altered (a clone will be)
 * @internal
 */
export function createRandom(sourceRng: RandomGenerator): Random {
  return adaptRandomGenerator(sourceRng.clone());
}

/**
 * Generate a random integer between min (included) and max (included)
 * @param mrng - Random number generator
 * @param min - Minimal integer value
 * @param max - Maximal integer value
 * @internal
 */
export function nextInt(mrng: Random, min: number, max: number): number {
  return uniformInt(mrng, min, max);
}

/**
 * Generate a random bigint between min (included) and max (included)
 * @param mrng - Random number generator
 * @param min - Minimal bigint value
 * @param max - Maximal bigint value
 * @internal
 */
export function nextBigInt(mrng: Random, min: bigint, max: bigint): bigint {
  return uniformBigInt(mrng, min, max);
}
