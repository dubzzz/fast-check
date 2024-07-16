import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Value } from '../check/arbitrary/definition/Value';
import { Random } from '../random/generator/Random';
import { Stream } from '../stream/Stream';

/**
 * Build an arbitrary without any bias.
 *
 * The produced instance wraps the source one and ensures the bias factor will always be passed to undefined meaning bias will be deactivated.
 * All the rest stays unchanged.
 *
 * @param arb - The original arbitrary used for generating values. This arbitrary remains unchanged.
 *
 * @remarks Since 3.20.0
 * @public
 */
export function noBias<T>(arb: Arbitrary<T>): Arbitrary<T> {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (Object.getPrototypeOf(arb) === NoBiasArbitrary.prototype && arb.generate === NoBiasArbitrary.prototype.generate) {
    return arb;
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return new NoBiasArbitrary(arb);
}

/** @internal */
class NoBiasArbitrary<T> extends Arbitrary<T> {
  constructor(readonly arb: Arbitrary<T>) {
    super();
  }
  generate(mrng: Random, _biasFactor: number | undefined): Value<T> {
    return this.arb.generate(mrng, undefined);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    return this.arb.canShrinkWithoutContext(value);
  }
  shrink(value: T, context?: unknown): Stream<Value<T>> {
    return this.arb.shrink(value, context);
  }
}
