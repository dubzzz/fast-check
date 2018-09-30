import * as prand from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { IProperty } from '../property/IProperty';

/** @hidden */
function lazyGenerate<Ts>(generator: IProperty<Ts>, rng: prand.RandomGenerator, idx: number): () => Shrinkable<Ts> {
  return () => generator.generate(new Random(rng), idx);
}

/** @hidden */
export function* toss<Ts>(
  generator: IProperty<Ts>,
  seed: number,
  random: (seed: number) => prand.RandomGenerator,
  examples: Ts[]
): IterableIterator<() => Shrinkable<Ts>> {
  yield* examples.map(e => () => new Shrinkable(e));
  let idx = 0;
  let rng = random(seed);
  for (;;) {
    rng = prand.skipN(rng, 42);
    yield lazyGenerate(generator, rng, idx++);
  }
}
