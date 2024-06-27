import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/** @internal */
export class LimitedShrinkPerLevelArbitrary<T> extends Arbitrary<T> {
  constructor(
    readonly arb: Arbitrary<T>,
    readonly maxPerShrinkLevel: number,
  ) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    return this.arb.generate(mrng, biasFactor);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    return this.arb.canShrinkWithoutContext(value);
  }
  shrink(value: T, context?: unknown): Stream<Value<T>> {
    return this.arb.shrink(value, context).take(this.maxPerShrinkLevel);
  }
}
