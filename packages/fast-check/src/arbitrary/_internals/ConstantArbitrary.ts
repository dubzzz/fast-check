import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { cloneMethod, hasCloneMethod } from '../../check/symbols';

const safeObjectIs = Object.is;

/** @internal */
export class ConstantArbitrary<T> extends Arbitrary<T> {
  constructor(readonly values: T[]) {
    super();
  }
  generate(mrng: Random, _biasFactor: number | undefined): Value<T> {
    const idx = this.values.length === 1 ? 0 : mrng.nextInt(0, this.values.length - 1);
    const value = this.values[idx];
    if (!hasCloneMethod(value)) {
      return new Value(value, idx);
    }
    return new Value(value, idx, () => value[cloneMethod]());
  }
  canShrinkWithoutContext(value: unknown): value is T {
    for (let idx = 0; idx !== this.values.length; ++idx) {
      if (safeObjectIs(this.values[idx], value)) {
        return true;
      }
    }
    return false;
  }
  shrink(value: T, context?: unknown): Stream<Value<T>> {
    if (context === 0 || safeObjectIs(value, this.values[0])) {
      return Stream.nil();
    }
    return Stream.of(new Value(this.values[0], 0));
  }
}
