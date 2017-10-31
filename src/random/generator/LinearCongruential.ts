import { RandomGenerator } from './RandomGenerator'

// Inspired from java.util.Random implementation
// http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/util/Random.java#Random.next%28int%29
const MULTIPLIER: number = 0x5DEECE66D;
const INCREMENT: number = 0xB;
const MASK: number = (2**48) - 1;

export default class LinearCongruential implements RandomGenerator {
    static readonly min: number = -(2**31);
    static readonly max: number = 2**31 -1;
    readonly seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }
    
    min(): number {
        return LinearCongruential.min;
    }
    
    max(): number {
        return LinearCongruential.max;
    }

    next(): [number, RandomGenerator] {
        const nextseed = (this.seed * MULTIPLIER + INCREMENT) & MASK;
        return [nextseed >>> 16, new LinearCongruential(nextseed)]
    }
}
