import { RandomGenerator, skipN } from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { IRawProperty } from '../property/IRawProperty';
import { Value } from '../arbitrary/definition/Value';
import { safeMap } from '../../utils/globals';
import { QualifiedRandomGenerator } from './configuration/QualifiedParameters';

/**
 * Extracting tossNext out of toss was dropping some bailout reasons on v8 side
 * @internal
 */
function tossNext<Ts>(generator: IRawProperty<Ts>, rng: QualifiedRandomGenerator, index: number): Value<Ts> {
  rng.unsafeJump();
  return generator.generate(new Random(rng), index);
}

/** @internal */
export function* toss<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => QualifiedRandomGenerator,
  examples: Ts[]
): IterableIterator<Value<Ts>> {
  for (let idx = 0; idx !== examples.length; ++idx) {
    yield new Value(examples[idx], undefined);
  }
  for (let idx = 0, rng = random(seed); ; ++idx) {
    yield tossNext(generator, rng, idx);
  }
}

/** @internal */
export function* lazyToss<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => RandomGenerator,
  examples: Ts[]
): IterableIterator<() => Value<Ts>> {
  yield* safeMap(examples, (e) => () => new Value(e, undefined));
  let idx = 0;
  let rng = random(seed);
  for (;;) {
    rng = rng.jump ? rng.jump() : skipN(rng, 42);
    yield () => generator.generate(new Random(rng), idx++);
  }
}
