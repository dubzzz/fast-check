import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { nat } from './IntegerArbitrary';

/**
 * Constraints to be applied on {@link option}
 * @remarks Since 2.2.0
 * @public
 */
export interface OptionConstraints<TNil = null> {
  /**
   * The probability to build a nil value is of `1 / freq`
   * @remarks Since 1.17.0
   */
  freq?: number;
  /**
   * The nil value (default would be null)
   * @remarks Since 1.17.0
   */
  nil?: TNil;
}

/** @internal */
class OptionArbitrary<T, TNil> extends Arbitrary<T | TNil> {
  readonly isOptionArb: Arbitrary<number>;
  constructor(readonly arb: Arbitrary<T>, readonly frequency: number, readonly nil: TNil) {
    super();
    this.isOptionArb = nat(frequency); // 1 chance over <frequency> to have non nil
  }
  private static extendedShrinkable<T, TNil>(s: Shrinkable<T>, nil: TNil): Shrinkable<T | TNil> {
    function* g(): IterableIterator<Shrinkable<T | TNil>> {
      yield new Shrinkable(nil);
    }
    return new Shrinkable(s.value_ as T | TNil, () =>
      s
        .shrink()
        .map((v) => OptionArbitrary.extendedShrinkable(v, nil))
        .join(g())
    );
  }
  generate(mrng: Random): Shrinkable<T | TNil> {
    return this.isOptionArb.generate(mrng).value === 0
      ? new Shrinkable(this.nil)
      : OptionArbitrary.extendedShrinkable(this.arb.generate(mrng), this.nil);
  }
  withBias(freq: number) {
    return new OptionArbitrary(this.arb.withBias(freq), this.frequency, this.nil);
  }
}

/**
 * For either nil or a value coming from `arb` with custom frequency
 *
 * @param arb - Arbitrary that will be called to generate a non nil value
 * @param constraints - Constraints on the option (since 1.17.0)
 *
 * @remarks Since 0.0.6
 * @public
 */
function option<T, TNil = null>(arb: Arbitrary<T>, constraints: OptionConstraints<TNil> = {}): Arbitrary<T | TNil> {
  const { freq = 5, nil = null } = constraints;
  return new OptionArbitrary(arb, freq, nil as TNil);
}

export { option };
