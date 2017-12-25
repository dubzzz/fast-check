import * as assert from 'power-assert';
import RandomGenerator from '../../../src/random/generator/RandomGenerator';
import UniformDistribution from '../../../src/random/distribution/UniformDistribution';
import * as sc from '../../../src/simple-check';

class NatGenerator implements RandomGenerator {
    readonly current: number;
    constructor(current: number) {
        this.current = current % 0x80000000;
    }

    next(): [number, RandomGenerator] {
        return [this.current, new NatGenerator(this.current +1)];
    }
    min(): number {
        return 0;
    }
    max(): number {
        return 0x7fffffff;
    }
}

const MAX_RANGE: number = 1000;

describe('UniformDistribution', () => {
    it('Should always generate values within the range', () => sc.assert(
        sc.property(sc.nat(), sc.integer(), sc.integer(0, MAX_RANGE),
            (offset, from, length) => {
                const [v, nrng] = UniformDistribution.inRange(from, from + length)(new NatGenerator(offset));
                return v >= from && v <= from + length;
            }
        )
    ));
    it('Should be able to generate all values within the range', () => sc.assert(
        sc.property(sc.nat(), sc.integer(), sc.integer(0, MAX_RANGE), sc.nat(),
            (offset, from, length, targetOffset) => {
                const target = from + (targetOffset) % (length +1);
                let rng: RandomGenerator = new NatGenerator(offset);
                for (let numTries = 0 ; numTries < 2*length +1 ; ++numTries) {
                    const [v, nrng] = UniformDistribution.inRange(from, from + length)(rng);
                    rng = nrng;
                    if (v === target) {
                        return true;
                    }
                }
                return false;//twice the length should always be enough (+1 to avoid length = 0)
            }
        )
    ));
    it('Should be evenly distributed over the range', () => sc.assert(
        sc.property(sc.nat(), sc.integer(), sc.integer(0, MAX_RANGE), sc.integer(1, 100),
            (offset, from, length, num) => {
                let buckets = [...Array(length+1)].map(() => 0);
                let rng: RandomGenerator = new NatGenerator(offset);
                for (let numTries = 0 ; numTries < num * (length +1) ; ++numTries) {
                    const [v, nrng] = UniformDistribution.inRange(from, from + length)(rng);
                    rng = nrng;
                    buckets[v -from] += 1;
                }
                return buckets.every(n => n === num);
            }
        )
    ));
});
