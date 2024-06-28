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
      if (context.depth >= this.maxShrinks) {
        return Stream.nil();
      }
      return this.arb
        .shrink(value, context.originalContext)
        .take(this.maxShrinks - context.depth)
        .map((v) => this.valueMapper(v, context.depth + 1));
    }
    if (this.maxShrinks <= 0) {
      return Stream.nil();
    }
    return this.arb
      .shrink(value, undefined)
      .take(this.maxShrinks)
      .map((v) => this.valueMapper(v, 0));
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
