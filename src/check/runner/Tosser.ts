import * as prand from 'pure-rand';

import Random from '../../random/generator/Random';
import Arbitrary from '../arbitrary/definition/Arbitrary';
import Shrinkable from '../arbitrary/definition/Shrinkable';
import IProperty from '../property/IProperty';

/** @hidden */
function lazyGenerate<Ts>(generator: IProperty<Ts>, rng: prand.RandomGenerator): () => Shrinkable<Ts> {
  return () => generator.generate(new Random(rng));
}

/** @hidden */
export default function* toss<Ts>(generator: IProperty<Ts>, seed: number): IterableIterator<() => Shrinkable<Ts>> {
  let rng = prand.mersenne(seed);
  for (;;) {
    rng = prand.skipN(rng, 42);
    yield lazyGenerate(generator, rng);
  }
}

export { toss };
