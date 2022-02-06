import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

export type AdapterOutput<T> = { adapted: boolean; value: T };

const AdaptedValue = Symbol('adapted-value');

/**
 * @internal
 * Adapt an existing Arbitrary by truncating its generating values
 * if they don't fit the requirements
 */
class AdapterArbitrary<T> extends NextArbitrary<T> {
  constructor(private readonly sourceArb: NextArbitrary<T>, private readonly adapter: (value: T) => AdapterOutput<T>) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): NextValue<T> {
    const rawValue = this.sourceArb.generate(mrng, biasFactor);
    const adapted = this.adapter(rawValue.value_);
    if (!adapted.adapted) {
      return rawValue; // No need to adapt it
    }
    return new NextValue(adapted.value, AdaptedValue);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    return this.sourceArb.canShrinkWithoutContext(value) && !this.adapter(value).adapted;
  }
  shrink(value: T, context: unknown): Stream<NextValue<T>> {
    if (context === AdaptedValue) {
      return this.sourceArb.shrink(value, undefined);
    }
    return this.sourceArb.shrink(value, context);
  }
}

/** @internal */
export function adapter<T>(sourceArb: NextArbitrary<T>, adapter: (value: T) => AdapterOutput<T>): NextArbitrary<T> {
  return new AdapterArbitrary(sourceArb, adapter);
}
