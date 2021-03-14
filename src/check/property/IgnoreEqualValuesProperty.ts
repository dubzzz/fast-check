import { IRawProperty } from './IRawProperty';
import { Random } from '../../random/generator/Random';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { stringify } from '../../utils/stringify';

/** @internal */
export class IgnoreEqualValuesProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  private coveredCases: Map<string, ReturnType<IRawProperty<Ts, IsAsync>['run']>> = new Map();

  constructor(readonly property: IRawProperty<Ts, IsAsync>) {}

  isAsync = (): IsAsync => this.property.isAsync();
  generate = (mrng: Random, runId?: number): Shrinkable<Ts> => this.property.generate(mrng, runId);
  run = (v: Ts): ReturnType<IRawProperty<Ts, IsAsync>['run']> => {
    const stringifiedValue = stringify(v);
    if (this.coveredCases.has(stringifiedValue)) {
      return this.coveredCases.get(stringifiedValue) as ReturnType<IRawProperty<Ts, IsAsync>['run']>;
    }
    const out = this.property.run(v);
    this.coveredCases.set(stringifiedValue, out);
    return out;
  };
}
