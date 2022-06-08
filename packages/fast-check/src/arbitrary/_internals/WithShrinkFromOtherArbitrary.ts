import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/** @internal */
function isSafeContext(context: unknown): context is { generatorContext: unknown } | { shrinkerContext: unknown } {
  return context !== undefined;
}

/** @internal */
function toGeneratorValue<T>(value: Value<T>): Value<T> {
  if (value.hasToBeCloned) {
    return new Value(value.value_, { generatorContext: value.context }, () => value.value);
  }
  return new Value(value.value_, { generatorContext: value.context });
}

/** @internal */
function toShrinkerValue<T>(value: Value<T>): Value<T> {
  if (value.hasToBeCloned) {
    return new Value(value.value_, { shrinkerContext: value.context }, () => value.value);
  }
  return new Value(value.value_, { shrinkerContext: value.context });
}

/** @internal */
export class WithShrinkFromOtherArbitrary<T> extends Arbitrary<T> {
  constructor(private readonly generatorArbitrary: Arbitrary<T>, private readonly shrinkerArbitrary: Arbitrary<T>) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    return toGeneratorValue(this.generatorArbitrary.generate(mrng, biasFactor));
  }

  canShrinkWithoutContext(value: unknown): value is T {
    return this.shrinkerArbitrary.canShrinkWithoutContext(value);
  }

  shrink(value: T, context: unknown): Stream<Value<T>> {
    if (!isSafeContext(context)) {
      return this.shrinkerArbitrary.shrink(value, undefined).map(toShrinkerValue);
    }
    if ('generatorContext' in context) {
      return this.generatorArbitrary.shrink(value, context.generatorContext).map(toGeneratorValue);
    }
    return this.shrinkerArbitrary.shrink(value, context.shrinkerContext).map(toShrinkerValue);
  }
}
