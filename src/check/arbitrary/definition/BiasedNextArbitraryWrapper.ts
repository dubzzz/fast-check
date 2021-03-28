import { Stream } from '../../../fast-check-default';
import { Random } from '../../../random/generator/Random';
import { NextArbitrary } from './NextArbitrary';
import { NextValue } from './NextValue';

/** @internal */
class BiasedNextArbitraryWrapper<T, TSourceArbitrary extends NextArbitrary<T>> extends NextArbitrary<T> {
  constructor(
    readonly freq: number,
    readonly arb: TSourceArbitrary,
    readonly biasedArbBuilder: (unbiased: TSourceArbitrary) => NextArbitrary<T>
  ) {
    super();
  }
  generate(mrng: Random) {
    return mrng.nextInt(1, this.freq) === 1 ? this.biasedArbBuilder(this.arb).generate(mrng) : this.arb.generate(mrng);
  }
  canGenerate(value: unknown): value is T {
    return this.arb.canGenerate(value);
  }
  shrink(value: T, context?: unknown): Stream<NextValue<T>> {
    return this.arb.shrink(value, context);
  }
}

/**
 * Helper function automatically choosing between the biased and unbiased versions of an Arbitrary.
 * This helper has been introduced in order to provide higher performances when building custom biased arbitraries
 * @internal
 */
export function nextBiasWrapper<T, TSourceArbitrary extends NextArbitrary<T>>(
  freq: number,
  arb: TSourceArbitrary,
  biasedArbBuilder: (unbiased: TSourceArbitrary) => NextArbitrary<T>
): NextArbitrary<T> {
  return new BiasedNextArbitraryWrapper(freq, arb, biasedArbBuilder);
}
