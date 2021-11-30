import { RandomGenerator, skipN } from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { IRawProperty } from '../property/IRawProperty';
import { Value } from '../arbitrary/definition/Value';

/** @internal */
function lazyGenerate<Ts>(generator: IRawProperty<Ts>, rng: RandomGenerator, idx: number): () => Value<Ts> {
  return () => generator.generate(new Random(rng), idx);
}

/** @internal */
export function* toss<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => RandomGenerator,
  examples: Ts[]
): IterableIterator<() => Value<Ts>> {
  yield* examples.map((e) => () => new Value(e, undefined));
  let idx = 0;
  let rng = random(seed);
  for (;;) {
    rng = rng.jump ? rng.jump() : skipN(rng, 42);
    yield lazyGenerate(generator, rng, idx++);
  }
}
