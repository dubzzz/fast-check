import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { nat } from './IntegerArbitrary';

/**
 * Constraints to be applied on {@link option}
 * @public
 */
export interface OptionConstraints<TNil = null> {
  /** The probability to build a nil value is of `1 / freq` */
  freq?: number;
  /** The nil value (default would be null) */
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
 * For either null or a value coming from `arb`
 *
 * @param arb - Arbitrary that will be called to generate a non null value
 *
 * @remarks Since 0.0.6
 * @public
 */
function option<T>(arb: Arbitrary<T>): Arbitrary<T | null>;
/**
 * For either null or a value coming from `arb` with custom frequency
 *
 * @param arb - Arbitrary that will be called to generate a non null value
 * @param freq - The probability to build a null value is of `1 / freq`
 *
 * @deprecated
 * Superceded by `fc.option(arb, {freq})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.6
 * @public
 */
function option<T>(arb: Arbitrary<T>, freq: number): Arbitrary<T | null>;
/**
 * For either nil or a value coming from `arb` with custom frequency
 *
 * @param arb - Arbitrary that will be called to generate a non nil value
 * @param constraints - Constraints on the option
 *
 * @public
 */
function option<T, TNil = null>(arb: Arbitrary<T>, constraints: OptionConstraints<TNil>): Arbitrary<T | TNil>;
function option<T, TNil>(arb: Arbitrary<T>, constraints?: number | OptionConstraints<TNil>): Arbitrary<T | TNil> {
  if (!constraints) return new OptionArbitrary(arb, 5, null as any);
  if (typeof constraints === 'number') return new OptionArbitrary(arb, constraints, null as any);

  return new OptionArbitrary(
    arb,
    constraints.freq == null ? 5 : constraints.freq,
    Object.prototype.hasOwnProperty.call(constraints, 'nil') ? constraints.nil : (null as any)
  );
}

export { option };
