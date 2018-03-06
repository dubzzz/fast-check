import { RandomGenerator } from 'pure-rand';
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';

/**
 * NoCallGenerator
 * 
 * no op generator
 * should not be called on any of its methods
 */
class NoCallGenerator implements RandomGenerator {
    next(): [number, RandomGenerator] {
        throw new Error("Method not implemented.");
    }
    min(): number {
        throw new Error("Method not implemented.");
    }
    max(): number {
        throw new Error("Method not implemented.");
    }
}

/**
 * FastIncreaseRandomGenerator
 * 
 * always increasing generator (up to max then "overflow")
 * increase factor increase itself at each new generation
 */
class FastIncreaseRandomGenerator implements RandomGenerator {
    value: number;
    incr: number;
    constructor(value: number, incr?: number) {
        this.value = value;
        this.incr = incr === undefined || incr === 0 ? 1 : incr;
    }
    next(): [number, RandomGenerator] {
        // need to tweak incr in order to use a large range of values
        // uniform distribution expects some entropy
        return [this.value, new FastIncreaseRandomGenerator((this.value + this.incr) | 0, 2 * this.incr +1)];
    }
    min(): number {
        return -0x80000000;
    }
    max(): number {
        return 0x7fffffff;
    }
}

/**
 * CounterRandomGenerator
 * 
 * generator starting at a `seed` value
 * and incrementing itself at each call to `next`
 */
class CounterRandomGenerator implements RandomGenerator {
    value: number;
    constructor(value: number) {
        this.value = value;
    }
    next(): [number, RandomGenerator] {
        return [this.value, new CounterRandomGenerator((this.value + 1) | 0)];
    }
    min(): number {
        return -0x80000000;
    }
    max(): number {
        return 0x7fffffff;
    }
}

const raw = {
    counter: (value: number) => new CounterRandomGenerator(value),
    nocall: () => new NoCallGenerator(),
    fastincrease: (value: number) => new FastIncreaseRandomGenerator(value)
};

const mutable = {
    counter: (value: number) => new MutableRandomGenerator(new CounterRandomGenerator(value)),
    nocall: () => new MutableRandomGenerator(new NoCallGenerator()),
    fastincrease: (value: number) => new MutableRandomGenerator(new FastIncreaseRandomGenerator(value))
};

export { mutable, raw };
