import { constant } from './ConstantArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { frequency } from './FrequencyArbitrary';
import { DepthContext } from './OneOfArbitrary';

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
  /**
   * While going deeper and deeper within a recursive structure,
   * this factor will be used to increase the probability to generate instances
   * of the first passed arbitrary
   */
  depthBiasFactor?: number;
  /**
   * Maximal authorized depth.
   * Once this depth has been reached only the first arbitrary will be used.
   */
  maxDepth?: number;
  /**
   * Context potentially shared with other entities.
   * If not provided, a context will be scoped on the instance.
   */
  depthContext?: DepthContext | string;
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
function option<T, TNil>(arb: Arbitrary<T>, constraints?: number | OptionConstraints<TNil>): Arbitrary<T | TNil> {
  if (!constraints) {
    return frequency(
      { withCrossShrink: true },
      { arbitrary: constant((null as any) as TNil), weight: 1 },
      { arbitrary: arb, weight: 5 }
    );
  }
  if (typeof constraints === 'number') {
    return frequency(
      { withCrossShrink: true },
      { arbitrary: constant((null as any) as TNil), weight: 1 },
      { arbitrary: arb, weight: constraints }
    );
  }
  return frequency(
    { ...constraints, withCrossShrink: true },
    {
      arbitrary: constant(
        Object.prototype.hasOwnProperty.call(constraints, 'nil') ? (constraints.nil as TNil) : ((null as any) as TNil)
      ),
      weight: 1,
    },
    { arbitrary: arb, weight: constraints.freq == null ? 5 : constraints.freq }
  );
}

export { option };
