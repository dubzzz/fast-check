import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { boolean } from '../../boolean';
import { constant } from '../../constant';
import { double } from '../../double';
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
    boolean(), // any boolean
    double({ next: true, noDefaultInfinity: true, noNaN: true }), // any number
    stringArbitrary, // any string
    constant(null),
  ];
  return constraints != null
    ? typeof constraints === 'number'
      ? { key, values, maxDepth: constraints }
      : { key, values, maxDepth: constraints.maxDepth }
    : { key, values };
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
