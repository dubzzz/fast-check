import type { RandomGenerator } from 'pure-rand/types/RandomGenerator';
import { Random } from '../../../src/random/generator/Random.js';

/**
 * NoCallGenerator
 *
 * no op generator
 * should not be called on any of its methods
 */
class NoCallGenerator implements RandomGenerator {
  clone(): RandomGenerator {
    return this;
  }
  next(): number {
    throw new Error('Method not implemented.');
  }
  getState(): readonly number[] {
    throw new Error('Method not implemented.');
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
  clone(): RandomGenerator {
    return new FastIncreaseRandomGenerator(this.value, this.incr);
  }
  next(): number {
    // need to tweak incr in order to use a large range of values
    // uniform distribution expects some entropy
    const out = this.value;
    this.value = (this.value + this.incr) | 0;
    this.incr = 2 * this.incr + 1;
    return out;
  }
  getState(): readonly number[] {
    throw new Error('Method not implemented.');
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
  clone(): RandomGenerator {
    return new CounterRandomGenerator(this.value);
  }
  next(): number {
    const out = this.value;
    this.value = (this.value + 1) | 0;
    return out;
  }
  getState(): readonly number[] {
    throw new Error('Method not implemented.');
  }
}

const raw = {
  counter: (value: number): RandomGenerator => new CounterRandomGenerator(value),
  nocall: (): RandomGenerator => new NoCallGenerator(),
  fastincrease: (value: number): RandomGenerator => new FastIncreaseRandomGenerator(value),
};

const mutable = {
  counter: (value: number): Random => new Random(new CounterRandomGenerator(value)),
  nocall: (): Random => new Random(new NoCallGenerator()),
  fastincrease: (value: number): Random => new Random(new FastIncreaseRandomGenerator(value)),
};

export { mutable, raw, CounterRandomGenerator, NoCallGenerator, FastIncreaseRandomGenerator };
