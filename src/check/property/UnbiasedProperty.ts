import Random from '../../random/generator/Random';
import IProperty from './IProperty';

/** @hidden */
export class UnbiasedProperty<Ts> implements IProperty<Ts> {
  constructor(readonly property: IProperty<Ts>) {}
  isAsync = () => this.property.isAsync();
  generate = (mrng: Random, runId?: number) => this.property.generate(mrng);
  run = (v: Ts) => this.property.run(v);
}
