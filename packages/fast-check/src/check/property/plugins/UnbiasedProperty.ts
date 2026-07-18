import type { Random } from '../../../random/generator/Random.js';
import type { Stream } from '../../../stream/Stream.js';
import type { Value } from '../../arbitrary/definition/Value.js';
import type { Property } from '../types/Property.js';

/** @internal */
export class UnbiasedProperty<Ts> implements Property<Ts> {
  constructor(readonly property: Property<Ts>) {}

  generate(mrng: Random, _runId?: number): Value<Ts> {
    return this.property.generate(mrng, undefined);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<Property<Ts>['run']> {
    return this.property.run(v);
  }

  runBeforeEach(): ReturnType<Property<Ts>['runBeforeEach']> {
    return this.property.runBeforeEach();
  }

  runAfterEach(): ReturnType<Property<Ts>['runAfterEach']> {
    return this.property.runAfterEach();
  }
}
