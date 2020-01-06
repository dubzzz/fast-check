import { Random } from '../../random/generator/Random';
import { IRawProperty } from './IRawProperty';

/** @internal */
export class UnbiasedProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  constructor(readonly property: IRawProperty<Ts, IsAsync>) {}
  isAsync = () => this.property.isAsync();
  generate = (mrng: Random, _runId?: number) => this.property.generate(mrng);
  run = (v: Ts) => this.property.run(v);
}
