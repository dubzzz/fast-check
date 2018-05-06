import * as prand from 'pure-rand';

export default class Random {
  private static MIN_INT: number = 0x80000000 | 0;
  private static MAX_INT: number = 0x7fffffff | 0;
  private static DBL_FACTOR: number = Math.pow(2, 27);
  private static DBL_DIVISOR: number = Math.pow(2, -53);

  /**
   * Create a mutable random number generator
   * @param internalRng Immutable random generator from pure-rand library
   */
  constructor(private internalRng: prand.RandomGenerator) {}

  /**
   * Clone the random number generator
   */
  clone(): Random {
    return new Random(this.internalRng);
  }
  private uniformIn(rangeMin: number, rangeMax: number): number {
    const [v, nrng] = prand.uniformIntDistribution(rangeMin, rangeMax)(this.internalRng);
    this.internalRng = nrng;
    return v;
  }

  /**
   * Generate an integer having `bits` random bits
   * @param bits Number of bits to generate
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
   * @param min Minimal integer value
   * @param max Maxiaml integer value
   */
  nextInt(min: number, max: number): number;
  nextInt(min?: number, max?: number): number {
    return this.uniformIn(min == null ? Random.MIN_INT : min, max == null ? Random.MAX_INT : max);
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

export { Random };
