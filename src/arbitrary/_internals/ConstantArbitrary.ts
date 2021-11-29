import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { cloneMethod, hasCloneMethod } from '../../check/symbols';

/** @internal */
export class ConstantArbitrary<T> extends Arbitrary<T> {
  constructor(readonly values: T[]) {
    super();
  }
  generate(mrng: Random, _biasFactor: number | undefined): NextValue<T> {
    const idx = this.values.length === 1 ? 0 : mrng.nextInt(0, this.values.length - 1);
    const value = this.values[idx];
    if (!hasCloneMethod(value)) {
      return new NextValue(value, idx);
    }
    return new NextValue(value, idx, () => value[cloneMethod]());
  }
  canShrinkWithoutContext(value: unknown): value is T {
    for (let idx = 0; idx !== this.values.length; ++idx) {
      if (Object.is(this.values[idx], value)) {
        return true;
      }
    }
    return false;
  }
  shrink(value: T, context?: unknown): Stream<NextValue<T>> {
    if (context === 0 || Object.is(value, this.values[0])) {
      return Stream.nil();
    }
    return Stream.of(new NextValue(this.values[0], 0));
  }
}
