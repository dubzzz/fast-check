import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { noUndefinedAsContext, UndefinedContextPlaceholder } from './helpers/NoUndefinedAsContext';

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
    const value = this.arb.generate(mrng, biasFactor);
    return noUndefinedAsContext(value);
  }

  canShrinkWithoutContext(value: unknown): value is Ts {
    return true;
  }

  shrink(value: Ts, context: unknown): Stream<NextValue<Ts>> {
    if (context === undefined && !this.arb.canShrinkWithoutContext(value)) {
      // This arbitrary will never produce any context being `undefined`
      // neither during `generate` nor during `shrink`
      return Stream.nil();
    }
    const safeContext = context !== UndefinedContextPlaceholder ? context : undefined;
    return this.arb.shrink(value, safeContext).map(noUndefinedAsContext);
  }
}
