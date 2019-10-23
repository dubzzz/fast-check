import { Random } from '../../random/generator/Random';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { IProperty } from './IProperty';

/** @hidden */
export class SkipAfterProperty<Ts> implements IProperty<Ts> {
  private skipAfterTime: number;
  constructor(
    readonly property: IProperty<Ts>,
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
      return new PreconditionFailure(this.interruptExecution);
    }
    return this.property.run(v);
  };
}
