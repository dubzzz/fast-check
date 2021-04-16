import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { cloneIfNeeded } from '../../check/symbols';

/** @internal */
export class ConstantArbitrary<T> extends NextArbitrary<T> {
  constructor(readonly values: T[]) {
    super();
  }
  generate(mrng: Random, _biasFactor: number | undefined): NextValue<T> {
    if (this.values.length === 1) {
      return new NextValue(this.values[0], 0, () => cloneIfNeeded(this.values[0]));
    }
    const idx = mrng.nextInt(0, this.values.length - 1);
    return new NextValue(this.values[idx], idx, () => cloneIfNeeded(this.values[idx]));
  }
  canGenerate(value: unknown): value is T {
    for (let idx = 0; idx !== this.values.length; ++idx) {
      if (Object.is(this.values[idx], value)) {
        return true;
      }
    }
    return false;
  }
  shrink(value: T, context?: unknown): Stream<NextValue<T>> {
    if (context === 0 || value === this.values[0]) {
      return Stream.nil();
    }
    return Stream.of(new NextValue(this.values[0], 0));
  }
}
