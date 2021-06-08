import { RandomGenerator, skipN } from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { IRawProperty } from '../property/IRawProperty';
import { AcceptedRandomGenerator, convertToRandomGenerator } from './configuration/AcceptedRandomGenerator';

/** @internal */
function lazyGenerate<Ts>(generator: IRawProperty<Ts>, rng: RandomGenerator, idx: number): () => Shrinkable<Ts> {
  return () => generator.generate(new Random(rng), idx);
}

/** @internal */
export function* toss<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => AcceptedRandomGenerator,
  examples: Ts[]
): IterableIterator<() => Shrinkable<Ts>> {
  yield* examples.map((e) => () => new Shrinkable(e));
  let idx = 0;
  let rng = convertToRandomGenerator(random(seed));
  for (;;) {
    rng = rng.jump ? rng.jump() : skipN(rng, 42);
    yield lazyGenerate(generator, rng, idx++);
  }
}
