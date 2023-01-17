import { RandomGenerator, skipN } from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { IRawProperty } from '../property/IRawProperty';
import { Value } from '../arbitrary/definition/Value';
import { safeMap } from '../../utils/globals';
import { QualifiedRandomGenerator } from './configuration/QualifiedParameters';

/** @internal */
export function* toss<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => QualifiedRandomGenerator,
  examples: Ts[]
): IterableIterator<Value<Ts>> {
  yield* safeMap(examples, (e) => new Value(e, undefined));
  let idx = 0;
  const rng = random(seed);
  for (;;) {
    rng.unsafeJump();
    yield generator.generate(new Random(rng), idx++);
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
