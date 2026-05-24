import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import type { Random } from '../../random/generator/Random.js';
import type { Stream } from '../../stream/Stream.js';
import { safeJoin, Error } from '../../utils/globals.js';

/** @internal */
type StringArbitraryContext = {
  originalValue: string[];
  originalContext: unknown;
};

/**
 * Specialised arbitrary equivalent to `array(charArb, …).map(tab => tab.join(''), unmapper)`.
 *
 * It is functionally identical to that pipeline but it inlines the {@link Value} / context
 * wrapping that would otherwise be performed by the generic {@link MapArbitrary}. Because the
 * mapped value is a primitive string, several branches of {@link MapArbitrary.mapperWithCloneIfNeeded}
 * are dead code, which we can elide here.
 *
 * @internal
 */
export class StringArbitrary extends Arbitrary<string> {
  constructor(
    private readonly arrayArb: Arbitrary<string[]>,
    private readonly unmapper: (value: unknown) => string[],
  ) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<string> {
    const g = this.arrayArb.generate(mrng, biasFactor);
    const source = g.value_;
    return new Value(safeJoin(source, ''), { originalValue: source, originalContext: g.context });
  }

  canShrinkWithoutContext(value: unknown): value is string {
    if (typeof value !== 'string') {
      return false;
    }
    try {
      const unmapped = this.unmapper(value);
      return this.arrayArb.canShrinkWithoutContext(unmapped);
    } catch (_err) {
      return false;
    }
  }

  shrink(value: string, context: unknown): Stream<Value<string>> {
    if (StringArbitrary.isSafeContext(context)) {
      return this.arrayArb.shrink(context.originalValue, context.originalContext).map(StringArbitrary.mapValue);
    }
    // shrink without context — value must satisfy canShrinkWithoutContext
    let unmapped: string[];
    try {
      unmapped = this.unmapper(value);
    } catch (_err) {
      throw new Error('Unable to shrink the received string');
    }
    return this.arrayArb.shrink(unmapped, undefined).map(StringArbitrary.mapValue);
  }

  private static mapValue(v: Value<string[]>): Value<string> {
    const source = v.value_;
    return new Value(safeJoin(source, ''), { originalValue: source, originalContext: v.context });
  }

  private static isSafeContext(context: unknown): context is StringArbitraryContext {
    return (
      context !== null &&
      context !== undefined &&
      typeof context === 'object' &&
      'originalValue' in (context as Record<string, unknown>) &&
      'originalContext' in (context as Record<string, unknown>)
    );
  }
}
