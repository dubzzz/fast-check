import { Random } from '../../random/generator/Random';
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
  isAsync = () => this.property.isAsync();
  generate = (mrng: Random, runId?: number) => this.property.generate(mrng, runId);
  run = (v: Ts) => {
    if (this.getTime() >= this.skipAfterTime) {
      const preconditionFailure = new PreconditionFailure(this.interruptExecution);
      if (this.isAsync()) {
        return Promise.resolve(preconditionFailure) as any; // IsAsync => Promise<PreconditionFailure | string | null>
      } else {
        return preconditionFailure as any; // !IsAsync => PreconditionFailure | string | null
      }
    }
    return this.property.run(v);
  };
}
