import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Value } from '../arbitrary/definition/Value';
import { IRawProperty } from './IRawProperty';

/** @internal */
export class UnbiasedProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  runBeforeEach?: () => (IsAsync extends true ? Promise<void> : never) | (IsAsync extends false ? void : never);
  runAfterEach?: () => (IsAsync extends true ? Promise<void> : never) | (IsAsync extends false ? void : never);

  constructor(readonly property: IRawProperty<Ts, IsAsync>) {
    const sourceRunBeforeEach = this.property.runBeforeEach;
    const sourceRunAfterEach = this.property.runAfterEach;
    if (sourceRunBeforeEach !== undefined && sourceRunAfterEach !== undefined) {
      this.runBeforeEach = () => sourceRunBeforeEach();
      this.runAfterEach = () => sourceRunAfterEach();
    }
  }

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, _runId?: number): Value<Ts> {
    return this.property.generate(mrng, undefined);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts, dontRunHook: boolean): ReturnType<IRawProperty<Ts, IsAsync>['run']> {
    return this.property.run(v, dontRunHook);
  }
}
