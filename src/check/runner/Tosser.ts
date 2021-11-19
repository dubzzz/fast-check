import { RandomGenerator, skipN } from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { INextRawProperty } from '../property/INextRawProperty';
import { NextValue } from '../arbitrary/definition/NextValue';

/** @internal */
function lazyGenerate<Ts>(generator: INextRawProperty<Ts>, rng: RandomGenerator, idx: number): () => NextValue<Ts> {
  return () => generator.generate(new Random(rng), idx);
}

/** @internal */
export function* toss<Ts>(
  generator: INextRawProperty<Ts>,
  seed: number,
  random: (seed: number) => RandomGenerator,
  examples: Ts[]
): IterableIterator<() => NextValue<Ts>> {
  yield* examples.map((e) => () => new NextValue(e, undefined));
  let idx = 0;
  let rng = random(seed);
  for (;;) {
    rng = rng.jump ? rng.jump() : skipN(rng, 42);
    yield lazyGenerate(generator, rng, idx++);
  }
}
