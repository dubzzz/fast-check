import { RandomGenerator } from './RandomGenerator'

// Inspired from java.util.Random implementation
// http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/util/Random.java#Random.next%28int%29
// Updated with values from: https://en.wikipedia.org/wiki/Linear_congruential_generator
const MULTIPLIER: number = 0x000343fd;
const INCREMENT: number = 0x00269ec3;
const MASK: number = 0xffffffff;
const MASK_2: number = (1 << 31) -1;

export default class LinearCongruential implements RandomGenerator {
    // Should produce exactly the same values
    // as the following C++ code compiled with Visual Studio:
    //  * constructor = srand(seed);
    //  * next        = rand();
    static readonly min: number = 0;
    static readonly max: number = 2**15 -1;

    constructor(readonly seed: number) {}
    
    min(): number {
        return LinearCongruential.min;
    }
    
    max(): number {
        return LinearCongruential.max;
    }

    next(): [number, RandomGenerator] {
        const nextseed = (this.seed * MULTIPLIER + INCREMENT) & MASK;
        return [(nextseed & MASK_2) >> 16, new LinearCongruential(nextseed)]
    }
}
