import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/**
 * Arbitrary considering any value as shrinkable whatever the received context.
 * In case the context corresponds to nil, it will be checked when calling shrink:
 * valid would mean stream coming from shrink, otherwise empty stream
 * @internal
 */
export class AlwaysShrinkableArbitrary<Ts> extends NextArbitrary<Ts> {
  constructor(readonly arb: NextArbitrary<Ts>) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<Ts> {
    return this.arb.generate(mrng, biasFactor);
  }

  canShrinkWithoutContext(value: unknown): value is Ts {
    return true;
  }

  shrink(value: Ts, context: unknown): Stream<NextValue<Ts>> {
    if (context === undefined && !this.arb.canShrinkWithoutContext(value)) {
      // At this point we make the asumption that if some arbitrary attaches the value undefined
      // to its value it must be able to recognize it as something it can shrink if it can shrink it.
      return Stream.nil();
    }
    return this.arb.shrink(value, context);
  }
}
