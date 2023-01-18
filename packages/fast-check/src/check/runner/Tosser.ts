import { RandomGenerator, skipN } from 'pure-rand';

import { Random } from '../../random/generator/Random';
import { IRawProperty } from '../property/IRawProperty';
import { Value } from '../arbitrary/definition/Value';
import { safeMap } from '../../utils/globals';
import { QualifiedRandomGenerator } from './configuration/QualifiedParameters';

/** @internal */
function tossNext<Ts>(generator: IRawProperty<Ts>, rng: QualifiedRandomGenerator, index: number): Value<Ts> {
  rng.unsafeJump();
  return generator.generate(new Random(rng), index);
}

/** @internal */
function* tossNoExamples<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => QualifiedRandomGenerator
): IterableIterator<Value<Ts>> {
  for (let idx = 0, rng = random(seed); ; ++idx) {
    yield tossNext(generator, rng, idx);
  }
}

/** @internal */
function* tossExamples<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => QualifiedRandomGenerator,
  examples: Ts[]
): IterableIterator<Value<Ts>> {
  yield* safeMap(examples, (e) => new Value(e, undefined));
  yield* tossNoExamples(generator, seed, random);
}

/** @internal */
export function toss<Ts>(
  generator: IRawProperty<Ts>,
  seed: number,
  random: (seed: number) => QualifiedRandomGenerator,
  examples: Ts[]
): IterableIterator<Value<Ts>> {
  // The split into multiple sub-toss has been done to drop some bailout linked to V8 when running this code
  // it used to be the source of many performance issues
  if (examples.length === 0) return tossNoExamples(generator, seed, random);
  else return tossExamples(generator, seed, random, examples);
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
