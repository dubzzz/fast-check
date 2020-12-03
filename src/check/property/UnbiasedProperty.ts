import { Random } from '../../random/generator/Random';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { IRawProperty } from './IRawProperty';

/** @internal */
export class UnbiasedProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  constructor(readonly property: IRawProperty<Ts, IsAsync>) {}
  isAsync = (): IsAsync => this.property.isAsync();
  generate = (mrng: Random, _runId?: number): Shrinkable<Ts> => this.property.generate(mrng);
  run = (v: Ts): ReturnType<IRawProperty<Ts, IsAsync>['run']> => this.property.run(v);
}
