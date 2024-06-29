import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/** @internal */
export class LimitedShrinkArbitrary<T> extends Arbitrary<T> {
  constructor(
    readonly arb: Arbitrary<T>,
    readonly maxShrinks: number,
  ) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    const value = this.arb.generate(mrng, biasFactor);
    return this.valueMapper(value, 0);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    return this.arb.canShrinkWithoutContext(value);
  }
  shrink(value: T, context?: unknown): Stream<Value<T>> {
    if (this.isSafeContext(context)) {
      return this.safeShrink(value, context.originalContext, context.length);
    }
    return this.safeShrink(value, undefined, 0);
  }
  private safeShrink(value: T, originalContext: unknown, currentLength: number): Stream<Value<T>> {
    const remaining = this.maxShrinks - currentLength;
    if (remaining <= 0) {
      return Stream.nil(); // early-exit to avoid potentially expensive computations in .shrink
    }
    return new Stream(zip(this.arb.shrink(value, originalContext), iotaFrom(currentLength + 1)))
      .take(remaining)
      .map((valueAndLength) => this.valueMapper(valueAndLength[0], valueAndLength[1]));
  }
  private valueMapper(v: Value<T>, newLength: number): Value<T> {
    const context: LimitedShrinkArbitraryContext<T> = { originalContext: v.context, length: newLength };
    return new Value(v.value, context);
  }
  private isSafeContext(context: unknown): context is LimitedShrinkArbitraryContext<T> {
    return (
      context != null &&
      typeof context === 'object' &&
      'originalContext' in (context as any) &&
      'length' in (context as any)
    );
  }
}

/** @internal */
function* iotaFrom(startValue: number) {
  let value = startValue;
  while (true) {
    yield value;
    ++value;
  }
}

/** @internal */
function* zip<T, U>(i1: IterableIterator<T>, i2: IterableIterator<U>): IterableIterator<[T, U]> {
  let v1 = i1.next();
  let v2 = i2.next();
  while (!v1.done && !v2.done) {
    yield [v1.value, v2.value];
    v1 = i1.next();
    v2 = i2.next();
  }
}

/** @internal */
type LimitedShrinkArbitraryContext<T> = {
  originalContext: unknown;
  length: number;
};
