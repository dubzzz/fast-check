import { Random } from '../../random/generator/Random';
import { IProperty } from './IProperty';

/** @hidden */
export class UnbiasedProperty<Ts, IsAsync extends boolean> implements IProperty<Ts, IsAsync> {
  constructor(readonly property: IProperty<Ts, IsAsync>) {}
  isAsync = () => this.property.isAsync();
  generate = (mrng: Random, runId?: number) => this.property.generate(mrng);
  run = (v: Ts) => this.property.run(v);
}
