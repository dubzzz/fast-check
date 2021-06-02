import * as prand from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { IRawProperty } from '../property/IRawProperty';

/** @internal */
function lazyGenerate<Ts>(generator: IRawProperty<Ts>, rng: prand.RandomGenerator, idx: number): () => Shrinkable<Ts> {
  return () => generator.generate(new Random(rng), idx);
}

/** @internal */
class TosserGenerator<Ts> implements IterableIterator<() => Shrinkable<Ts>> {
  private rng: prand.RandomGenerator;
  private currentIndex: number;
  constructor(
    readonly generator: IRawProperty<Ts>,
    readonly seed: number,
    readonly random: (seed: number) => prand.RandomGenerator,
    readonly examples: Ts[]
  ) {
    this.rng = random(seed);
    this.currentIndex = -1;
  }
  [Symbol.iterator](): IterableIterator<() => Shrinkable<Ts>> {
    if (this.currentIndex === -1) {
      return this;
    }
    return new TosserGenerator(this.generator, this.seed, this.random, this.examples);
  }
  next(): IteratorResult<() => Shrinkable<Ts>> {
    ++this.currentIndex;
    if (this.currentIndex < this.examples.length) {
      return { value: () => new Shrinkable(this.examples[this.currentIndex]), done: false };
    }
    this.rng = this.rng.jump ? this.rng.jump() : prand.skipN(this.rng, 42);
    return { value: lazyGenerate(this.generator, this.rng, this.currentIndex - this.examples.length) };
  }
}

/** @internal */
export function toss<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => prand.RandomGenerator,
  examples: Ts[]
): IterableIterator<() => Shrinkable<Ts>> {
  return new TosserGenerator(generator, seed, random, examples);
}
