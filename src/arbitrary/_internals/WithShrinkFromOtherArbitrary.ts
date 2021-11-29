import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/** @internal */
function isSafeContext(context: unknown): context is { generatorContext: unknown } | { shrinkerContext: unknown } {
  return context !== undefined;
}

/** @internal */
function toGeneratorNextValue<T>(value: NextValue<T>): NextValue<T> {
  if (value.hasToBeCloned) {
    return new NextValue(value.value_, { generatorContext: value.context }, () => value.value);
  }
  return new NextValue(value.value_, { generatorContext: value.context });
}

/** @internal */
function toShrinkerNextValue<T>(value: NextValue<T>): NextValue<T> {
  if (value.hasToBeCloned) {
    return new NextValue(value.value_, { shrinkerContext: value.context }, () => value.value);
  }
  return new NextValue(value.value_, { shrinkerContext: value.context });
}

/** @internal */
export class WithShrinkFromOtherArbitrary<T> extends Arbitrary<T> {
  constructor(private readonly generatorArbitrary: Arbitrary<T>, private readonly shrinkerArbitrary: Arbitrary<T>) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<T> {
    return toGeneratorNextValue(this.generatorArbitrary.generate(mrng, biasFactor));
  }

  canShrinkWithoutContext(value: unknown): value is T {
    return this.shrinkerArbitrary.canShrinkWithoutContext(value);
  }

  shrink(value: T, context: unknown): Stream<NextValue<T>> {
    if (!isSafeContext(context)) {
      return this.shrinkerArbitrary.shrink(value, undefined).map(toShrinkerNextValue);
    }
    if ('generatorContext' in context) {
      return this.generatorArbitrary.shrink(value, context.generatorContext).map(toGeneratorNextValue);
    }
    return this.shrinkerArbitrary.shrink(value, context.shrinkerContext).map(toShrinkerNextValue);
  }
}
