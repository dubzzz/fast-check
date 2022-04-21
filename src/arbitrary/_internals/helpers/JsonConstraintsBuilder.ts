import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { boolean } from '../../boolean';
import { constant } from '../../constant';
import { double } from '../../double';
import { DepthFactorSizeForArbitrary } from './MaxLengthFromMinLength';
import { ObjectConstraints } from './QualifiedObjectConstraints';

/**
 * Shared constraints for:
 * - {@link json},
 * - {@link unicodeJson},
 * - {@link jsonValue},
 * - {@link unicodeJsonValue}
 *
 * @remarks Since 2.5.0
 * @public
 */
export interface JsonSharedConstraints {
  /**
   * Limit the depth of the object by increasing the probability to generate simple values (defined via values)
   * as we go deeper in the object.
   *
   * @remarks Since 2.20.0
   */
  depthFactor?: DepthFactorSizeForArbitrary;
  /**
   * Maximal depth allowed
   * @remarks Since 2.5.0
   */
  maxDepth?: number;
}

/**
 * Derive `ObjectConstraints` from a `JsonSharedConstraints`
 * @internal
 */

export function jsonConstraintsBuilder(
  stringArbitrary: Arbitrary<string>,
  constraints: JsonSharedConstraints
): ObjectConstraints {
  const { depthFactor, maxDepth } = constraints;
  const key = stringArbitrary;
  const values = [
    boolean(), // any boolean
    double({ next: true, noDefaultInfinity: true, noNaN: true }), // any number
    stringArbitrary, // any string
    constant(null),
  ];
  return { key, values, depthFactor, maxDepth };
}

/**
 * Typings for a Json array
 * @remarks Since 2.20.0
 * @public
 */
export interface JsonArray extends Array<JsonValue> {}

/**
 * Typings for a Json object
 * @remarks Since 2.20.0
 * @public
 */
export type JsonObject = { [key in string]?: JsonValue };

/**
 * Typings for a Json value
 * @remarks Since 2.20.0
 * @public
 */
export type JsonValue = boolean | number | string | null | JsonArray | JsonObject;
