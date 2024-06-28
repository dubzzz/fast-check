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
      return this.safeShrink(value, context.originalContext, context.depth);
    }
    return this.safeShrink(value, undefined, 0);
  }
  private safeShrink(value: T, originalContext: unknown, currentDepth: number): Stream<Value<T>> {
    const remaining = this.maxShrinks - currentDepth;
    if (remaining <= 0) {
      return Stream.nil(); // early-exit to avoid potentially expensive computations in .shrink
    }
    return this.arb
      .shrink(value, originalContext)
      .take(remaining)
      .map((v) => this.valueMapper(v, currentDepth + 1));
  }
  private valueMapper(v: Value<T>, newDepth: number): Value<T> {
    const context: LimitedShrinkArbitraryContext<T> = { originalContext: v.context, depth: newDepth };
    return new Value(v.value, context);
  }
  private isSafeContext(context: unknown): context is LimitedShrinkArbitraryContext<T> {
    return (
      context != null &&
      typeof context === 'object' &&
      'originalContext' in (context as any) &&
      'depth' in (context as any)
    );
  }
}

/** @internal */
type LimitedShrinkArbitraryContext<T> = {
  originalContext: unknown;
  depth: number;
};
