import prand from 'pure-rand';

export default class Random {
    static MIN_INT: number = 0x80000000 | 0;
    static MAX_INT: number = 0x7fffffff | 0;
    static DBL_FACTOR: number = Math.pow(2, 27);
    static DBL_DIVISOR: number = Math.pow(2, -53);

    constructor(private rng_: prand.RandomGenerator) {}
    clone(): Random {
        return new Random(this.rng_);
    }
    private uniformIn(from: number, to: number): number {
        const [v, nrng] = prand.uniformIntDistribution(from, to)(this.rng_);
        this.rng_ = nrng;
        return v;
    }
    next(bits: number): number {
        return this.uniformIn(0, (1 << bits) -1);
    }
    nextBoolean(): boolean {
        return this.uniformIn(0, 1) == 1;
    }
    nextInt(): number;
    nextInt(min: number, max: number): number;
    nextInt(min?: number, max?: number): number {
        return this.uniformIn(min == null ? Random.MIN_INT : min, max == null ? Random.MAX_INT : max);
    }
    nextDouble(): number {
        const a = this.next(26);
        const b = this.next(27);
        return (a * Random.DBL_FACTOR + b) * Random.DBL_DIVISOR;
    }
}

export { Random };
