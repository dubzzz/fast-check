import { constant } from './ConstantArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { FrequencyArbitrary } from './FrequencyArbitrary';

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
function extractOptionConstraints<TNil>(constraints?: number | OptionConstraints<TNil>): OptionConstraints<TNil> {
  if (!constraints) return {};
  if (typeof constraints === 'number') return { freq: constraints };
  return constraints;
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
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
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
 * @remarks Since 1.17.0
 * @public
 */
function option<T, TNil = null>(arb: Arbitrary<T>, constraints: OptionConstraints<TNil>): Arbitrary<T | TNil>;
function option<T, TNil>(arb: Arbitrary<T>, rawConstraints?: number | OptionConstraints<TNil>): Arbitrary<T | TNil> {
  const constraints = extractOptionConstraints(rawConstraints);
  const freq = constraints.freq == null ? 5 : constraints.freq;
  const nilArb = constant(Object.prototype.hasOwnProperty.call(constraints, 'nil') ? constraints.nil : (null as any));
  const weightedArbs = [
    { arbitrary: nilArb, weight: 1 },
    { arbitrary: arb, weight: freq },
  ];
  const frequencyConstraints = { withCrossShrink: true };
  return FrequencyArbitrary.from(weightedArbs, frequencyConstraints, 'fc.option');
}

export { option };
