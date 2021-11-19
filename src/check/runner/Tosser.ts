import { RandomGenerator, skipN } from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { PureRandom, convertToRandomGenerator } from '../../random/generator/PureRandom';
import { IRawProperty } from '../property/IRawProperty';
import { NextValue } from '../arbitrary/definition/NextValue';

/** @internal */
function lazyGenerate<Ts>(generator: IRawProperty<Ts>, rng: RandomGenerator, idx: number): () => NextValue<Ts> {
  return () => generator.generate(new Random(rng), idx);
}

/** @internal */
export function* toss<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => PureRandom,
  examples: Ts[]
): IterableIterator<() => NextValue<Ts>> {
  yield* examples.map((e) => () => new NextValue(e, undefined));
  let idx = 0;
  let rng = convertToRandomGenerator(random(seed));
  for (;;) {
    rng = rng.jump ? rng.jump() : skipN(rng, 42);
    yield lazyGenerate(generator, rng, idx++);
  }
}
