import type { RandomGenerator } from 'pure-rand/types/RandomGenerator';

import { Random } from '../../random/generator/Random.js';
import type { Property } from '../property/types/Property.js';
import { Value } from '../arbitrary/definition/Value.js';
import type { QualifiedRandomGenerator } from './configuration/QualifiedParameters.js';
import { adaptRandomGenerator } from '../../random/generator/RandomGenerator.js';

/**
 * Extracting tossNext out of toss was dropping some bailout reasons on v8 side
 * @internal
 */
function tossNext<Ts>(
  generator: Pick<Property<Ts>, 'generate'>,
  rng: QualifiedRandomGenerator,
  index: number,
): Value<Ts> {
  rng.jump();
  return generator.generate(new Random(rng), index);
}

/** @internal */
export function* toss<Ts>(
  generator: Pick<Property<Ts>, 'generate'>,
  seed: number,
  random: (seed: number) => QualifiedRandomGenerator,
  examples: Ts[],
): IterableIterator<Value<Ts>> {
  for (let idx = 0; idx !== examples.length; ++idx) {
    yield new Value(examples[idx], undefined);
  }
  for (let idx = 0, rng = random(seed); ; ++idx) {
    yield tossNext(generator, rng, idx);
  }
}

/** @internal */
function lazyGenerate<Ts>(
  generator: Pick<Property<Ts>, 'generate'>,
  rng: RandomGenerator,
  idx: number,
): () => Value<Ts> {
  return () => generator.generate(new Random(rng), idx);
}

/** @internal */
export function* lazyToss<Ts>(
  generator: Pick<Property<Ts>, 'generate'>,
  seed: number,
  random: (seed: number) => RandomGenerator,
  examples: Ts[],
): IterableIterator<() => Value<Ts>> {
  yield* examples.map((e) => () => new Value(e, undefined));
  let idx = 0;
  const rng = adaptRandomGenerator(random(seed));
  for (;;) {
    rng.jump();
    yield lazyGenerate(generator, rng, idx++);
  }
}
