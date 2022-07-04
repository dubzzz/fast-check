import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/** @internal */
export type AdapterOutput<T> = { adapted: boolean; value: T };

/** @internal */
const AdaptedValue = Symbol('adapted-value');

/** @internal */
function toAdapterValue<T>(rawValue: Value<T>, adapter: (value: T) => AdapterOutput<T>): Value<T> {
  const adapted = adapter(rawValue.value_);
  if (!adapted.adapted) {
    return rawValue; // No need to adapt it
  }
  return new Value(adapted.value, AdaptedValue);
}

/**
 * @internal
 * Adapt an existing Arbitrary by truncating its generating values
 * if they don't fit the requirements
 */
class AdapterArbitrary<T> extends Arbitrary<T> {
  private readonly adaptValue: (rawValue: Value<T>) => Value<T>;
  constructor(private readonly sourceArb: Arbitrary<T>, private readonly adapter: (value: T) => AdapterOutput<T>) {
    super();
    this.adaptValue = (rawValue) => toAdapterValue(rawValue, adapter);
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    const rawValue = this.sourceArb.generate(mrng, biasFactor);
    return this.adaptValue(rawValue);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    return this.sourceArb.canShrinkWithoutContext(value) && !this.adapter(value).adapted;
  }
  shrink(value: T, context: unknown): Stream<Value<T>> {
    if (context === AdaptedValue) {
      if (!this.sourceArb.canShrinkWithoutContext(value)) {
        return Stream.nil();
      }
      return this.sourceArb.shrink(value, undefined).map(this.adaptValue);
    }
    return this.sourceArb.shrink(value, context).map(this.adaptValue);
  }
}

/** @internal */
export function adapter<T>(sourceArb: Arbitrary<T>, adapter: (value: T) => AdapterOutput<T>): Arbitrary<T> {
  return new AdapterArbitrary(sourceArb, adapter);
}
