import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { boolean } from '../../boolean';
import { constant } from '../../constant';
import { double } from '../../double';
import { maxSafeInteger } from '../../maxSafeInteger';
import { ObjectConstraints } from './QualifiedObjectConstraints';

/**
 * Shared constraints for:
 * - {@link json},
 * - {@link unicodeJson},
 * - {@link jsonObject},
 * - {@link unicodeJsonObject}
 *
 * @remarks Since 2.5.0
 * @public
 */
export interface JsonSharedConstraints {
  /**
   * Maximal depth allowed
   * @remarks Since 2.5.0
   */
  maxDepth?: number;
}

/**
 * Derive `ObjectConstraints` from a `number | JsonSharedConstraints`
 * @internal
 */

export function jsonConstraintsBuilder(
  stringArbitrary: Arbitrary<string>,
  constraints?: number | JsonSharedConstraints
): ObjectConstraints {
  const key = stringArbitrary;
  const values = [
    boolean(),
    maxSafeInteger(),
    double({ next: true, noDefaultInfinity: true, noNaN: true }),
    stringArbitrary,
    constant(null),
  ];
  return constraints != null
    ? typeof constraints === 'number'
      ? { key, values, maxDepth: constraints }
      : { key, values, maxDepth: constraints.maxDepth }
    : { key, values };
}
