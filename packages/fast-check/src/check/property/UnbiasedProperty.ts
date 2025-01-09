import type { Random } from '../../random/generator/Random';
import type { Stream } from '../../stream/Stream';
import type { Value } from '../arbitrary/definition/Value';
import type { IRawProperty } from './IRawProperty';

/** @internal */
export class UnbiasedProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  constructor(readonly property: IRawProperty<Ts, IsAsync>) {}

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, _runId?: number): Value<Ts> {
    return this.property.generate(mrng, undefined);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<IRawProperty<Ts, IsAsync>['run']> {
    return this.property.run(v);
  }

  runBeforeEach(): ReturnType<IRawProperty<Ts, IsAsync>['runBeforeEach']> {
    return this.property.runBeforeEach();
  }

  runAfterEach(): ReturnType<IRawProperty<Ts, IsAsync>['runAfterEach']> {
    return this.property.runAfterEach();
  }
}
