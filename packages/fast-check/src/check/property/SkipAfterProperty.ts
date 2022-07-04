import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Value } from '../arbitrary/definition/Value';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { IRawProperty } from './IRawProperty';

/** @internal */
export class SkipAfterProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  private skipAfterTime: number;
  constructor(
    readonly property: IRawProperty<Ts, IsAsync>,
    readonly getTime: () => number,
    timeLimit: number,
    readonly interruptExecution: boolean
  ) {
    this.skipAfterTime = this.getTime() + timeLimit;
  }

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<IRawProperty<Ts, IsAsync>['run']> {
    if (this.getTime() >= this.skipAfterTime) {
      const preconditionFailure = new PreconditionFailure(this.interruptExecution);
      if (this.isAsync()) {
        return Promise.resolve(preconditionFailure) as any; // IsAsync => Promise<PreconditionFailure | string | null>
      } else {
        return preconditionFailure as any; // !IsAsync => PreconditionFailure | string | null
      }
    }
    return this.property.run(v);
  }
}
