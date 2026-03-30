import type { Random } from '../../random/generator/Random.js';
import type { Stream } from '../../stream/Stream.js';
import type { Value } from '../arbitrary/definition/Value.js';
import type { IRawProperty } from './IRawProperty.js';

/** @internal */
export class UnbiasedProperty<Ts> implements IRawProperty<Ts> {
  constructor(readonly property: IRawProperty<Ts>) {}

  generate(mrng: Random, _runId?: number): Value<Ts> {
    return this.property.generate(mrng, undefined);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<IRawProperty<Ts>['run']> {
    return this.property.run(v);
  }

  runBeforeEach(): ReturnType<IRawProperty<Ts>['runBeforeEach']> {
    return this.property.runBeforeEach();
  }

  runAfterEach(): ReturnType<IRawProperty<Ts>['runAfterEach']> {
    return this.property.runAfterEach();
  }
}
