import { uniformBigInt } from 'pure-rand/distribution/uniformBigInt';
import { uniformInt } from 'pure-rand/distribution/uniformInt';
import { adaptRandomGenerator } from './RandomGenerator.js';
import type { RandomGenerator, RandomGeneratorInternal } from './RandomGenerator.js';

const MIN_INT: number = 0x80000000 | 0;
const MAX_INT: number = 0x7fffffff | 0;
const DBL_FACTOR: number = Math.pow(2, 27);
const DBL_DIVISOR: number = Math.pow(2, -53);

/**
 * Wrapper around an instance of a `pure-rand`'s random number generator
 * offering a simpler interface to deal with random with impure patterns
 *
 * @public
 */
export class Random {
  /** @internal */
  private internalRng: RandomGeneratorInternal;

  /**
   * Create a mutable random number generator by cloning the passed one and mutate it
   * @param sourceRng - Immutable random generator from pure-rand library, will not be altered (a clone will be)
   */
  constructor(sourceRng: RandomGenerator) {
    this.internalRng = adaptRandomGenerator(sourceRng.clone());
  }

  /**
   * Clone the random number generator
   */
  clone(): Random {
    return new Random(this.internalRng);
  }

  /**
   * Generate an integer having `bits` random bits
   * @param bits - Number of bits to generate
   */
  next(bits: number): number {
    return uniformInt(this.internalRng, 0, (1 << bits) - 1);
  }

  /**
   * Generate a random boolean
   */

  nextBoolean(): boolean {
    return uniformInt(this.internalRng, 0, 1) === 1;
  }

  /**
   * Generate a random integer (32 bits)
   */
  nextInt(): number;

  /**
   * Generate a random integer between min (included) and max (included)
   * @param min - Minimal integer value
   * @param max - Maximal integer value
   */
  nextInt(min: number, max: number): number;
  nextInt(min?: number, max?: number): number {
    return uniformInt(this.internalRng, min === undefined ? MIN_INT : min, max === undefined ? MAX_INT : max);
  }

  /**
   * Generate a random bigint between min (included) and max (included)
   * @param min - Minimal bigint value
   * @param max - Maximal bigint value
   */
  nextBigInt(min: bigint, max: bigint): bigint {
    return uniformBigInt(this.internalRng, min, max);
  }

  /**
   * Generate a random floating point number between 0.0 (included) and 1.0 (excluded)
   */
  nextDouble(): number {
    const a = this.next(26);
    const b = this.next(27);
    return (a * DBL_FACTOR + b) * DBL_DIVISOR;
  }

  /**
   * Extract the internal state of the internal RandomGenerator backing the current instance of Random
   */
  getState(): readonly number[] | undefined {
    if ('getState' in this.internalRng && typeof this.internalRng.getState === 'function') {
      return this.internalRng.getState();
    }
    return undefined;
  }
}
