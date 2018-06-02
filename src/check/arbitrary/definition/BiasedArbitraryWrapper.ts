import Random from '../../../random/generator/Random';
import Arbitrary from './Arbitrary';
import Shrinkable from './Shrinkable';

/** @hidden */
class BiasedArbitraryWrapper<T> extends Arbitrary<T> {
  constructor(
    readonly freq: number,
    readonly arb: Arbitrary<T>,
    readonly biasedArbBuilder: (unbiased: Arbitrary<T>) => Arbitrary<T>
  ) {
    super();
  }
  generate(mrng: Random) {
    return mrng.nextInt(1, this.freq) === 1 ? this.biasedArbBuilder(this.arb).generate(mrng) : this.arb.generate(mrng);
  }
}

/**
 * Helper function automatically choosing between the biased and unbiased
 * versions of an Arbitrary
 */
export function biasWrapper<T>(
  freq: number,
  arb: Arbitrary<T>,
  biasedArbBuilder: (unbiased: Arbitrary<T>) => Arbitrary<T>
): Arbitrary<T> {
  return new BiasedArbitraryWrapper(freq, arb, biasedArbBuilder);
}
