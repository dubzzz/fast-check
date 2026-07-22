import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import type { Value } from '../../check/arbitrary/definition/Value.js';
import type { Random } from '../../random/generator/Random.js';

/** @internal */
export class LazyArbitrary<T> extends Arbitrary<T> {
  underlying: Arbitrary<T> | null = null;
  constructor(readonly name: string) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    if (this.underlying === null) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.generate(mrng, biasFactor);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    if (this.underlying === null) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.canShrinkWithoutContext(value);
  }
  shrink(value: T, context?: unknown): IteratorObject<Value<T>> {
    if (this.underlying === null) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.shrink(value, context);
  }
}
