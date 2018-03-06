import { RandomGenerator } from 'pure-rand';

export default class MutableRandomGenerator implements RandomGenerator {
    constructor(private rng_: RandomGenerator) {}
    min(): number {
        return this.rng_.min();
    }
    max(): number {
        return this.rng_.max();
    }
    next(): [number, RandomGenerator] {
        const [value, nrng] = this.rng_.next();
        this.rng_ = nrng;
        return [value, this];
    }
    rng(): RandomGenerator {
        return this.rng_;
    }
}

export { MutableRandomGenerator };
