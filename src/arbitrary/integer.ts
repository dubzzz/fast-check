import { ArbitraryWithContextualShrink } from '../check/arbitrary/definition/ArbitraryWithContextualShrink';
import { convertFromNextWithShrunkOnce } from '../check/arbitrary/definition/Converters';
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
 * For integers between min (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances (since 2.6.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
export function integer(constraints: IntegerConstraints = {}): ArbitraryWithContextualShrink<number> {
  const fullConstraints = buildCompleteIntegerConstraints(constraints);
  if (fullConstraints.min > fullConstraints.max) {
    throw new Error('fc.integer maximum value should be equal or greater than the minimum one');
  }
  if (!Number.isInteger(fullConstraints.min)) {
    throw new Error('fc.integer minimum value should be an integer');
  }
  if (!Number.isInteger(fullConstraints.max)) {
    throw new Error('fc.integer maximum value should be an integer');
  }
  const arb = new IntegerArbitrary(fullConstraints.min, fullConstraints.max);
  return convertFromNextWithShrunkOnce(arb, arb.defaultTarget());
}
