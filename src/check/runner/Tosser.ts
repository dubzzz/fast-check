import * as prand from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { IProperty } from '../property/IProperty';
import { RandomType } from './configuration/RandomType';

/** @hidden */
function lazyGenerate<Ts>(generator: IProperty<Ts>, rng: prand.RandomGenerator, idx: number): () => Shrinkable<Ts> {
  return () => generator.generate(new Random(rng), idx);
}

/** @hidden */
function buildRngFor(seed: number, random: RandomType): prand.RandomGenerator {
  switch (random) {
    case 'mersenne':
      return prand.mersenne(seed);
    case 'congruential':
      return prand.congruential(seed);
    case 'congruential32':
      return prand.congruential32(seed);
    default:
      throw new Error(`Invalid random specified: '${random}'`);
  }
}

/** @hidden */
export function* toss<Ts>(
  generator: IProperty<Ts>,
  seed: number,
  random: RandomType,
  examples: Ts[]
): IterableIterator<() => Shrinkable<Ts>> {
  yield* examples.map(e => () => new Shrinkable(e));
  let idx = 0;
  let rng = buildRngFor(seed, random);
  for (;;) {
    rng = prand.skipN(rng, 42);
    yield lazyGenerate(generator, rng, idx++);
  }
}
