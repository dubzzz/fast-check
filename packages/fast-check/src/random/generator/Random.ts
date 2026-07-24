import { uniformBigInt } from 'pure-rand/distribution/uniformBigInt';
import { uniformInt } from 'pure-rand/distribution/uniformInt';
import { adaptRandomGenerator } from './RandomGenerator.js';
import type { RandomGenerator, RandomGeneratorInternal } from './RandomGenerator.js';

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
   * Generate a random integer between min (included) and max (included)
   * @param min - Minimal integer value
   * @param max - Maximal integer value
   */
  nextInt(min: number, max: number): number {
    return uniformInt(this.internalRng, min, max);
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
    const a = uniformInt(this.internalRng, 0, 0x3ffffff);
    const b = uniformInt(this.internalRng, 0, 0x7ffffff);
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
