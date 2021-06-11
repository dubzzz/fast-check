import * as prand from 'pure-rand';
import { PureRandom, convertToRandomGenerator } from './PureRandom';

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

  private internalRng: prand.RandomGenerator;

  /**
   * Create a mutable random number generator
   * @param sourceRng - Immutable random generator from pure-rand library, will not be altered
   */
  constructor(sourceRng: PureRandom) {
    this.internalRng = convertToRandomGenerator(sourceRng);
  }

  /**
   * Clone the random number generator
   */
  clone(): Random {
    return new Random(this.internalRng);
  }

  private uniformIn(rangeMin: number, rangeMax: number): number {
    const g = prand.uniformIntDistribution(rangeMin, rangeMax, this.internalRng);
    this.internalRng = g[1];
    return g[0];
  }

  /**
   * Generate an integer having `bits` random bits
   * @param bits - Number of bits to generate
   */
  next(bits: number): number {
    return this.uniformIn(0, (1 << bits) - 1);
  }

  /**
   * Generate a random boolean
   */

  nextBoolean(): boolean {
    return this.uniformIn(0, 1) === 1;
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
    return this.uniformIn(min == null ? Random.MIN_INT : min, max == null ? Random.MAX_INT : max);
  }

  /**
   * Generate a random bigint between min (included) and max (included)
   * @param min - Minimal bigint value
   * @param max - Maximal bigint value
   */
  nextBigInt(min: bigint, max: bigint): bigint {
    const g = prand.uniformBigIntDistribution(min, max, this.internalRng);
    this.internalRng = g[1];
    return g[0];
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
    const g = prand.uniformArrayIntDistribution(min, max, this.internalRng);
    this.internalRng = g[1];
    return g[0];
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
