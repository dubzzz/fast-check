import { Random } from '../../random/generator/Random';
import { NextValue } from '../arbitrary/definition/NextValue';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { INextRawProperty } from './INextRawProperty';
import { IRawProperty } from './IRawProperty';

const identifier = '__ConverterFromNextProperty__';

/** @internal */
function fromNextValueToShrinkableFor<T>(property: INextRawProperty<T>) {
  return function fromNextValueToShrinkable(v: NextValue<T>): Shrinkable<T, T> {
    const shrinker = () => property.shrink(v).map(fromNextValueToShrinkable);
    if (!v.hasToBeCloned) {
      return new Shrinkable(v.value_, shrinker);
    }
    return new Shrinkable(v.value_, shrinker, () => v.value);
  };
}

/** @internal */
export class ConverterFromNextProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  [identifier] = true;
  static isConverterFromNext<Ts, IsAsync extends boolean>(
    property: IRawProperty<Ts, IsAsync>
  ): property is ConverterFromNextProperty<Ts, IsAsync> {
    return identifier in property;
  }

  public toShrinkable: (v: NextValue<Ts>) => Shrinkable<Ts, Ts>;
  constructor(readonly property: INextRawProperty<Ts, IsAsync>) {
    this.toShrinkable = fromNextValueToShrinkableFor(property);
  }

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, runId?: number): Shrinkable<Ts> {
    const value = this.property.generate(mrng, runId);
    return this.toShrinkable(value);
  }

  run(
    v: Ts
  ):
    | (IsAsync extends true ? Promise<string | PreconditionFailure | null> : never)
    | (IsAsync extends false ? string | PreconditionFailure | null : never) {
    return this.property.run(v);
  }
}
