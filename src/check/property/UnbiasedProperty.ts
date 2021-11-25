import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { NextValue } from '../arbitrary/definition/NextValue';
import { IRawProperty } from './IRawProperty';

/** @internal */
export class UnbiasedProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  constructor(readonly property: IRawProperty<Ts, IsAsync>) {}

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, _runId?: number): NextValue<Ts> {
    return this.property.generate(mrng, undefined);
  }

  shrink(value: NextValue<Ts>): Stream<NextValue<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<IRawProperty<Ts, IsAsync>['run']> {
    return this.property.run(v);
  }
}
