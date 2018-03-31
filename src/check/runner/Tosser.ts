import prand from 'pure-rand';

import Arbitrary from '../arbitrary/definition/Arbitrary';
import Shrinkable from '../arbitrary/definition/Shrinkable';
import Random from '../../random/generator/Random';
import IProperty from '../property/IProperty';

function lazyGenerate<Ts>(generator: IProperty<Ts> | Arbitrary<Ts>, rng: prand.RandomGenerator): () => Shrinkable<Ts> {
  return () => generator.generate(new Random(rng));
}

export default function* toss<Ts>(
  generator: IProperty<Ts> | Arbitrary<Ts>,
  seed: number
): IterableIterator<() => Shrinkable<Ts>> {
  let rng = prand.mersenne(seed);
  for (;;) {
    rng = prand.skipN(rng, 42);
    yield lazyGenerate(generator, rng);
  }
}

export { toss };
