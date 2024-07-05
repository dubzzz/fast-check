import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import type { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { zipIterableIterators } from './helpers/ZipIterableIterators';

/** @internal */
function* iotaFrom(startValue: number) {
  let value = startValue;
  while (true) {
    yield value;
    ++value;
  }
}

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
    return new Stream(zipIterableIterators(this.arb.shrink(value, originalContext), iotaFrom(currentLength + 1)))
      .take(remaining)
      .map((valueAndLength) => this.valueMapper(valueAndLength[0], valueAndLength[1]));
  }
  private valueMapper(v: Value<T>, newLength: number): Value<T> {
    const context: LimitedShrinkArbitraryContext = { originalContext: v.context, length: newLength };
    return new Value(v.value, context);
  }
  private isSafeContext(context: unknown): context is LimitedShrinkArbitraryContext {
    return (
      context != null &&
      typeof context === 'object' &&
      'originalContext' in (context as any) &&
      'length' in (context as any)
    );
  }
}

/** @internal */
type LimitedShrinkArbitraryContext = {
  originalContext: unknown;
  length: number;
};
