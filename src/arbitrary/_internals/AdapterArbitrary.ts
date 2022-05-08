import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/** @internal */
export type AdapterOutput<T> = { adapted: boolean; value: T };

/** @internal */
const AdaptedValue = Symbol('adapted-value');

/** @internal */
function toAdapterNextValue<T>(rawValue: NextValue<T>, adapter: (value: T) => AdapterOutput<T>): NextValue<T> {
  const adapted = adapter(rawValue.value_);
  if (!adapted.adapted) {
    return rawValue; // No need to adapt it
  }
  return new NextValue(adapted.value, AdaptedValue);
}

/**
 * @internal
 * Adapt an existing Arbitrary by truncating its generating values
 * if they don't fit the requirements
 */
class AdapterArbitrary<T> extends Arbitrary<T> {
  private readonly adaptNextValue: (rawValue: NextValue<T>) => NextValue<T>;
  constructor(private readonly sourceArb: Arbitrary<T>, private readonly adapter: (value: T) => AdapterOutput<T>) {
    super();
    this.adaptNextValue = (rawValue) => toAdapterNextValue(rawValue, adapter);
  }
  generate(mrng: Random, biasFactor: number | undefined): NextValue<T> {
    const rawValue = this.sourceArb.generate(mrng, biasFactor);
    return this.adaptNextValue(rawValue);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    return this.sourceArb.canShrinkWithoutContext(value) && !this.adapter(value).adapted;
  }
  shrink(value: T, context: unknown): Stream<NextValue<T>> {
    if (context === AdaptedValue) {
      if (!this.sourceArb.canShrinkWithoutContext(value)) {
        return Stream.nil();
      }
      return this.sourceArb.shrink(value, undefined).map(this.adaptNextValue);
    }
    return this.sourceArb.shrink(value, context).map(this.adaptNextValue);
  }
}

/** @internal */
export function adapter<T>(sourceArb: Arbitrary<T>, adapter: (value: T) => AdapterOutput<T>): Arbitrary<T> {
  return new AdapterArbitrary(sourceArb, adapter);
}
