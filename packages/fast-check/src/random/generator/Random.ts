import {
  RandomGenerator,
  unsafeUniformArrayIntDistribution,
  unsafeUniformBigIntDistribution,
  unsafeUniformIntDistribution,
} from 'pure-rand';

/**
 * Wrapper around an instance of a `pure-rand`'s random number generator
 * offering a simpler interface to deal with random with impure patterns
 *
 * @public
 */
export class Random {
  private static MIN_INT: number = 0x80000000 | 0;
  private static MAX_INT: number = 0x7fffffff | 0;
  private static DBL_FACTOR: number = Math.pow(2, 27);
  private static DBL_DIVISOR: number = Math.pow(2, -53);

  private internalRng: RandomGenerator;

  /**
   * Create a mutable random number generator by cloning the passed one and mutate it
   * @param sourceRng - Immutable random generator from pure-rand library, will not be altered (a clone will be)
   */
  constructor(sourceRng: RandomGenerator) {
    this.internalRng = sourceRng.clone();
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
    return unsafeUniformIntDistribution(0, (1 << bits) - 1, this.internalRng);
  }

  /**
   * Generate a random boolean
   */

  nextBoolean(): boolean {
    return unsafeUniformIntDistribution(0, 1, this.internalRng) == 1;
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
    return unsafeUniformIntDistribution(
      min == null ? Random.MIN_INT : min,
      max == null ? Random.MAX_INT : max,
      this.internalRng
    );
  }

  /**
   * Generate a random bigint between min (included) and max (included)
   * @param min - Minimal bigint value
   * @param max - Maximal bigint value
   */
  nextBigInt(min: bigint, max: bigint): bigint {
    return unsafeUniformBigIntDistribution(min, max, this.internalRng);
  }

  /**
   * Generate a random ArrayInt between min (included) and max (included)
   * @param min - Minimal ArrayInt value
   * @param max - Maximal ArrayInt value
   */
  nextArrayInt(
    min: { sign: 1 | -1; data: number[] },
    max: { sign: 1 | -1; data: number[] }
  ): { sign: 1 | -1; data: number[] } {
    return unsafeUniformArrayIntDistribution(min, max, this.internalRng);
  }

  /**
   * Generate a random floating point number between 0.0 (included) and 1.0 (excluded)
   */
  nextDouble(): number {
    const a = this.next(26);
    const b = this.next(27);
    return (a * Random.DBL_FACTOR + b) * Random.DBL_DIVISOR;
  }
}
