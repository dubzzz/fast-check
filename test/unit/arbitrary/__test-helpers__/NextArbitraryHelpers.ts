import { MaybeMocked, MockWithArgs } from './Mocked';
import { NextArbitrary } from '../../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';

/**
 * Generate a fake Class inheriting from NextArbitrary with all methods being mocked
 */
export function fakeNextArbitraryClass<T = any>(): { Class: new () => NextArbitrary<T> } & MaybeMocked<
  NextArbitrary<T>
> {
  const generate = jest.fn();
  const canShrinkWithoutContext = jest.fn() as any as ((value: unknown) => value is T) &
    MockWithArgs<(value: unknown) => value is T>;
  const shrink = jest.fn();
  const filter = jest.fn();
  const map = jest.fn();
  const chain = jest.fn();
  const noShrink = jest.fn();
  const noBias = jest.fn();

  class FakeNextArbitrary extends NextArbitrary<T> {
    generate = generate;
    canShrinkWithoutContext = canShrinkWithoutContext;
    shrink = shrink;
    filter = filter;
    map = map;
    chain = chain;
    noShrink = noShrink;
    noBias = noBias;
  }
  return { Class: FakeNextArbitrary, generate, canShrinkWithoutContext, shrink, filter, map, chain, noShrink, noBias };
}

/**
 * Generate a fake instance inheriting from NextArbitrary with all methods being mocked
 */
export function fakeNextArbitrary<T = any>(): { instance: NextArbitrary<T> } & MaybeMocked<NextArbitrary<T>> {
  const { Class, ...mockedMethods } = fakeNextArbitraryClass<T>();
  return { instance: new Class(), ...mockedMethods };
}

/**
 * Generate a fake instance inheriting from NextArbitrary but always producing the same value
 */
export function fakeNextArbitraryStaticValue<T>(
  value: () => T,
  context: () => unknown = () => undefined
): { instance: NextArbitrary<T> } {
  const { instance, generate, map } = fakeNextArbitrary<T>();
  generate.mockImplementation(() => new NextValue(value(), context()));
  map.mockImplementation((mapper) => {
    return fakeNextArbitraryStaticValue(() => mapper(value())).instance;
  });
  return { instance };
}

/**
 * Fake instance with the following capabilities:
 * - shrink to strictly smaller values
 * - fully implemented canShrinkWithoutContext
 * - take bias into account on generate
 * - context less shrink like context full (for first iteration only)
 */
export class FakeIntegerArbitrary extends NextArbitrary<number> {
  constructor(readonly offset: number = 0, readonly rangeLength: number = 100) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): NextValue<number> {
    const minRange = Math.floor(this.rangeLength / 10);
    const maxRange = this.rangeLength;
    // Worst case: 0-minRange
    // No bias   : 0-maxRange
    const maxLimit = biasFactor !== undefined ? Math.max(minRange, maxRange - biasFactor) : maxRange;
    return new NextValue(mrng.nextInt(0, maxLimit) + this.offset, { step: 2 });
  }
  canShrinkWithoutContext(value: unknown): value is number {
    return (
      typeof value === 'number' &&
      value >= this.offset &&
      value <= this.rangeLength + this.offset &&
      Number.isInteger(value)
    );
  }
  shrink(value: number, context?: unknown): Stream<NextValue<number>> {
    const currentStep = context !== undefined ? (context as { step: number }).step : 2;
    const nextStep = currentStep + 1;
    return Stream.of(
      ...(value - currentStep >= this.offset ? [new NextValue(value - currentStep, { step: nextStep })] : []),
      ...(value - currentStep + 1 >= this.offset ? [new NextValue(value - currentStep + 1, { step: nextStep })] : [])
    );
  }
}
