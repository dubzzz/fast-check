import RandomGenerator from '../../../src/random/generator/RandomGenerator';

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

class DummyRandomGenerator implements RandomGenerator {
    value: number;
    incr: number;
    constructor(value: number, incr?: number) {
        this.value = value;
        this.incr = incr === undefined || incr === 0 ? 1 : incr;
    }
    next(): [number, RandomGenerator] {
        // need to tweak incr in order to use a large range of values
        // uniform distribution expects some entropy
        return [this.value, new DummyRandomGenerator((this.value + this.incr) | 0, 2 * this.incr +1)];
    }
    min(): number {
        return -0x80000000;
    }
    max(): number {
        return 0x7fffffff;
    }
}

class IncrementRandomGenerator implements RandomGenerator {
    value: number;
    constructor(value: number) {
        this.value = value;
    }
    next(): [number, RandomGenerator] {
        return [this.value, new IncrementRandomGenerator((this.value + 1) | 0)];
    }
    min(): number {
        return -0x80000000;
    }
    max(): number {
        return 0x7fffffff;
    }
}

export { NoCallGenerator, DummyRandomGenerator, IncrementRandomGenerator };
