import type { RandomGenerator } from 'pure-rand/types/RandomGenerator';

import { createRandom } from '../../random/generator/Random.js';
import type { IRawProperty } from '../property/IRawProperty.js';
import { Value } from '../arbitrary/definition/Value.js';
import { safeMap } from '../../utils/globals.js';
import type { QualifiedRandomGenerator } from './configuration/QualifiedParameters.js';
import { adaptRandomGenerator } from '../../random/generator/RandomGenerator.js';

/**
 * Extracting tossNext out of toss was dropping some bailout reasons on v8 side
 * @internal
 */
function tossNext<Ts>(generator: IRawProperty<Ts>, rng: QualifiedRandomGenerator, index: number): Value<Ts> {
  rng.jump();
  return generator.generate(createRandom(rng), index);
}

/** @internal */
export function* toss<Ts>(
  generator: IRawProperty<Ts>,
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
function lazyGenerate<Ts>(generator: IRawProperty<Ts>, rng: RandomGenerator, idx: number): () => Value<Ts> {
  return () => generator.generate(createRandom(rng), idx);
}

/** @internal */
export function* lazyToss<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => RandomGenerator,
  examples: Ts[],
): IterableIterator<() => Value<Ts>> {
  yield* safeMap(examples, (e) => () => new Value(e, undefined));
  let idx = 0;
  const rng = adaptRandomGenerator(random(seed));
  for (;;) {
    rng.jump();
    yield lazyGenerate(generator, rng, idx++);
  }
}
