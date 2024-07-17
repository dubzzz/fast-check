import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import type { Value } from '../check/arbitrary/definition/Value';
import type { Random } from '../random/generator/Random';
import { Stream } from '../stream/Stream';

const stableObjectGetPrototypeOf = Object.getPrototypeOf;

/**
 * Build an arbitrary without shrinking capabilities.
 *
 * NOTE:
 * In most cases, users should avoid disabling shrinking capabilities.
 * If the concern is the shrinking process taking too long or being unnecessary in CI environments,
 * consider using alternatives like `endOnFailure` or `interruptAfterTimeLimit` instead.
 *
 * @param arb - The original arbitrary used for generating values. This arbitrary remains unchanged, but its shrinking capabilities will not be included in the new arbitrary.
 *
 * @remarks Since 3.20.0
 * @public
 */
export function noShrink<T>(arb: Arbitrary<T>): Arbitrary<T> {
  if (
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stableObjectGetPrototypeOf(arb) === NoShrinkArbitrary.prototype &&
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    arb.shrink === NoShrinkArbitrary.prototype.shrink
  ) {
    return arb;
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return new NoShrinkArbitrary(arb);
}

/** @internal */
class NoShrinkArbitrary<T> extends Arbitrary<T> {
  constructor(readonly arb: Arbitrary<T>) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    return this.arb.generate(mrng, biasFactor);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    return this.arb.canShrinkWithoutContext(value);
  }
  shrink(_value: T, _context?: unknown): Stream<Value<T>> {
    return Stream.nil();
  }
}
