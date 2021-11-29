import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { IntegerArbitrary } from './_internals/IntegerArbitrary';

/**
 * Constraints to be applied on {@link integer}
 * @remarks Since 2.6.0
 * @public
 */
export interface IntegerConstraints {
  /**
   * Lower bound for the generated integers (included)
   * @defaultValue -0x80000000
   * @remarks Since 2.6.0
   */
  min?: number;
  /**
   * Upper bound for the generated integers (included)
   * @defaultValue 0x7fffffff
   * @remarks Since 2.6.0
   */
  max?: number;
}

/**
 * Build fully set IntegerConstraints from a partial data
 * @internal
 */
function buildCompleteIntegerConstraints(constraints: IntegerConstraints): Required<IntegerConstraints> {
  const min = constraints.min !== undefined ? constraints.min : -0x80000000;
  const max = constraints.max !== undefined ? constraints.max : 0x7fffffff;
  return { min, max };
}

/**
 * Extract constraints from args received by integer
 * @internal
 */
function extractIntegerConstraints(args: [] | [number, number] | [IntegerConstraints]): IntegerConstraints {
  if (args[0] === undefined) {
    // integer()
    return {};
  } // args.length > 0

  if (args[1] === undefined) {
    const sargs = args as typeof args & [unknown]; // exactly 1 arg specified
    return sargs[0]; // integer(constraints)
  } // args.length > 1

  const sargs = args as typeof args & [unknown, unknown];
  return { min: sargs[0], max: sargs[1] }; // integer(min, max)
}

/**
 * For integers between -2147483648 (included) and 2147483647 (included)
 * @remarks Since 0.0.1
 * @public
 */
function integer(): Arbitrary<number>;
/**
 * For integers between min (included) and max (included)
 *
 * @param min - Lower bound for the generated integers (eg.: 0, Number.MIN_SAFE_INTEGER)
 * @param max - Upper bound for the generated integers (eg.: 2147483647, Number.MAX_SAFE_INTEGER)
 *
 * @remarks You may prefer to use `fc.integer({min, max})` instead.
 * @remarks Since 0.0.1
 * @public
 */
function integer(min: number, max: number): Arbitrary<number>;
/**
 * For integers between min (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.6.0
 * @public
 */
function integer(constraints: IntegerConstraints): Arbitrary<number>;
function integer(...args: [] | [number, number] | [IntegerConstraints]): Arbitrary<number> {
  const constraints = buildCompleteIntegerConstraints(extractIntegerConstraints(args));
  if (constraints.min > constraints.max) {
    throw new Error('fc.integer maximum value should be equal or greater than the minimum one');
  }
  return new IntegerArbitrary(constraints.min, constraints.max);
}
export { integer };
