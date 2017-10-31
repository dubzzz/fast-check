import { RandomGenerator } from './RandomGenerator'

// Inspired from java.util.Random implementation
// http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/util/Random.java#Random.next%28int%29
const MULTIPLIER: number = 0x5DEECE66D;
const OFFSET: number = 0xB;
const MASK: number = (1 << 48) - 1;

export default class LinearCongruential implements RandomGenerator {
    readonly seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    next(): [number, RandomGenerator] {
        const nextseed = (this.seed * MULTIPLIER + OFFSET) & MASK;
        return [nextseed >> 16, new LinearCongruential(nextseed)]
    }
}
