import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { nat } from './IntegerArbitrary';

/** @hidden */
class OptionArbitrary<T> extends Arbitrary<T | null> {
  readonly isOptionArb: Arbitrary<number>;
  constructor(readonly arb: Arbitrary<T>, readonly frequency: number) {
    super();
    this.isOptionArb = nat(frequency); // 1 chance over <frequency> to have non null
  }
  private static extendedShrinkable<T>(s: Shrinkable<T>): Shrinkable<T | null> {
    function* g(): IterableIterator<Shrinkable<T | null>> {
      yield new Shrinkable(null);
    }
    return new Shrinkable(s.value_, () =>
      s
        .shrink()
        .map(OptionArbitrary.extendedShrinkable)
        .join(g())
    );
  }
  generate(mrng: Random): Shrinkable<T | null> {
    return this.isOptionArb.generate(mrng).value === 0
      ? new Shrinkable(null)
      : OptionArbitrary.extendedShrinkable(this.arb.generate(mrng));
  }
  withBias(freq: number) {
    return new OptionArbitrary(this.arb.withBias(freq), this.frequency);
  }
}

/**
 * For either null or a value coming from `arb`
 * @param arb Arbitrary that will be called to generate a non null value
 */
function option<T>(arb: Arbitrary<T>): Arbitrary<T | null>;
/**
 * For either null or a value coming from `arb` with custom frequency
 * @param arb Arbitrary that will be called to generate a non null value
 * @param freq The probability to build a null value is of `1 / freq`
 */
function option<T>(arb: Arbitrary<T>, freq: number): Arbitrary<T | null>;
function option<T>(arb: Arbitrary<T>, freq?: number): Arbitrary<T | null> {
  return new OptionArbitrary(arb, freq == null ? 5 : freq);
}

export { option };
