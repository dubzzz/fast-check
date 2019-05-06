import { Random } from '../../random/generator/Random';
import { pre } from '../precondition/Pre';
import { IProperty } from './IProperty';

/** @hidden */
export class SkipAfterProperty<Ts> implements IProperty<Ts> {
  private skipAfterTime: number;
  constructor(readonly property: IProperty<Ts>, readonly getTime: () => number, timeLimit: number) {
    this.skipAfterTime = this.getTime() + timeLimit;
  }
  isAsync = () => this.property.isAsync();
  generate = (mrng: Random, runId?: number) => this.property.generate(mrng, runId);
  run = (v: Ts) => {
    pre(this.getTime() < this.skipAfterTime);
    return this.property.run(v);
  };
}
