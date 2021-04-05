import { mocked } from 'ts-jest';
import { MaybeMocked, MockWithArgs } from 'ts-jest/dist/utils/testing';
import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { Random } from '../../../../../src/random/generator/Random';
import { Stream } from '../../../../../src/stream/Stream';

/**
 * Generate a fake Class inheriting from NextArbitrary with all methods being mocked
 */
export function fakeNextArbitraryClass<T = any>(): { Class: new () => NextArbitrary<T> } & MaybeMocked<
  NextArbitrary<T>
> {
  const generate = jest.fn();
  const canGenerate = (jest.fn() as any) as ((value: unknown) => value is T) &
    MockWithArgs<(value: unknown) => value is T>;
  const shrink = jest.fn();
  const filter = jest.fn();
  const map = jest.fn();
  const chain = jest.fn();
  const noShrink = jest.fn();
  const noBias = jest.fn();
  mocked;
  class FakeNextArbitrary extends NextArbitrary<T> {
    generate = generate;
    canGenerate = canGenerate;
    shrink = shrink;
    filter = filter;
    map = map;
    chain = chain;
    noShrink = noShrink;
    noBias = noBias;
  }
  return { Class: FakeNextArbitrary, generate, canGenerate, shrink, filter, map, chain, noShrink, noBias };
}

/**
 * Generate a fake instance inheriting from NextArbitrary with all methods being mocked
 */
export function fakeNextArbitrary<T = any>(): { instance: NextArbitrary<T> } & MaybeMocked<NextArbitrary<T>> {
  const { Class, ...mockedMethods } = fakeNextArbitraryClass<T>();
  return { instance: new Class(), ...mockedMethods };
}

/**
 * Fake instance with the following capabilities:
 * - shrink to strictly smaller values
 * - fully implemented canGenerate
 * - take bias into account on generate
 * - context less shrink like context full (for first iteration only)
 */
export class FakeIntegerArbitrary extends NextArbitrary<number> {
  generate(mrng: Random, biasFactor: number | undefined): NextValue<number> {
    // Worst case: 0-10
    // No bias   : 0-100
    const maxLimit = biasFactor !== undefined ? Math.max(10, 100 - biasFactor) : 100;
    return new NextValue(mrng.nextInt(0, maxLimit), { step: 2 });
  }
  canGenerate(value: unknown): value is number {
    return typeof value === 'number' && value >= 0 && value <= 100 && Number.isInteger(value);
  }
  shrink(value: number, context?: unknown): Stream<NextValue<number>> {
    if (value <= 0) {
      return Stream.nil();
    }
    const currentStep = context !== undefined ? (context as { step: number }).step : 2;
    const nextStep = currentStep + 1;
    return Stream.of(
      ...(value - currentStep >= 0 ? [new NextValue(value - currentStep, { step: nextStep })] : []),
      ...(value - currentStep + 1 >= 0 ? [new NextValue(value - currentStep + 1, { step: nextStep })] : [])
    );
  }
}
