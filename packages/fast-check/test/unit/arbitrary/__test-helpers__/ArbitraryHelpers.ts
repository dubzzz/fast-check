import { vi } from 'vitest';
import type { MaybeMocked, MockWithArgs } from '../../__test-helpers__/Mocked';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import type { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';

/**
 * Generate a fake Class inheriting from Arbitrary with all methods being mocked
 */
export function fakeArbitraryClass<T = any>(): { Class: new () => Arbitrary<T> } & MaybeMocked<Arbitrary<T>> {
  const generate = vi.fn();
  const canShrinkWithoutContext = vi.fn() as any as ((value: unknown) => value is T) &
    MockWithArgs<(value: unknown) => value is T>;
  const shrink = vi.fn();
  const filter = vi.fn();
  const map = vi.fn();
  const chain = vi.fn();
  const noShrink = vi.fn();

  class FakeArbitrary extends Arbitrary<T> {
    generate = generate;
    canShrinkWithoutContext = canShrinkWithoutContext;
    shrink = shrink;
    filter = filter;
    map = map;
    chain = chain;
    noShrink = noShrink;
  }
  return { Class: FakeArbitrary, generate, canShrinkWithoutContext, shrink, filter, map, chain, noShrink };
}

/**
 * Generate a fake instance inheriting from Arbitrary with all methods being mocked
 */
export function fakeArbitrary<T = any>(): { instance: Arbitrary<T> } & MaybeMocked<Arbitrary<T>> {
  const { Class, ...mockedMethods } = fakeArbitraryClass<T>();
  return { instance: new Class(), ...mockedMethods };
}

/**
 * Generate a fake instance inheriting from Arbitrary but always producing the same value
 */
export function fakeArbitraryStaticValue<T>(
  value: () => T,
  context: () => unknown = () => undefined,
): { instance: Arbitrary<T> } {
  const { instance, generate, map } = fakeArbitrary<T>();
  generate.mockImplementation(() => new Value(value(), context()));
  map.mockImplementation((mapper) => {
    return fakeArbitraryStaticValue(() => mapper(value())).instance;
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
export class FakeIntegerArbitrary extends Arbitrary<number> {
  constructor(
    readonly offset: number = 0,
    readonly rangeLength: number = 100,
  ) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<number> {
    const minRange = Math.floor(this.rangeLength / 10);
    const maxRange = this.rangeLength;
    // Worst case: 0-minRange
    // No bias   : 0-maxRange
    const maxLimit = biasFactor !== undefined ? Math.max(minRange, maxRange - biasFactor) : maxRange;
    return new Value(mrng.nextInt(0, maxLimit) + this.offset, { step: 2 });
  }
  canShrinkWithoutContext(value: unknown): value is number {
    return (
      typeof value === 'number' &&
      value >= this.offset &&
      value <= this.rangeLength + this.offset &&
      Number.isInteger(value)
    );
  }
  shrink(value: number, context?: unknown): Stream<Value<number>> {
    const currentStep = context !== undefined ? (context as { step: number }).step : 2;
    const nextStep = currentStep + 1;
    return Stream.of(
      ...(value - currentStep >= this.offset ? [new Value(value - currentStep, { step: nextStep })] : []),
      ...(value - currentStep + 1 >= this.offset ? [new Value(value - currentStep + 1, { step: nextStep })] : []),
    );
  }
}
