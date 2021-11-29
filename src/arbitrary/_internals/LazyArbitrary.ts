import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/** @internal */
export class LazyArbitrary<T> extends Arbitrary<T> {
  underlying: Arbitrary<T> | null = null;
  constructor(readonly name: string) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): NextValue<T> {
    if (!this.underlying) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.generate(mrng, biasFactor);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    if (!this.underlying) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.canShrinkWithoutContext(value);
  }
  shrink(value: T, context?: unknown): Stream<NextValue<T>> {
    if (!this.underlying) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.shrink(value, context);
  }
}
