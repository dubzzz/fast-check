import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { boolean } from '../../boolean';
import { constant } from '../../constant';
import { double } from '../../double';
import type { DepthSize } from './MaxLengthFromMinLength';
import type { ObjectConstraints } from './QualifiedObjectConstraints';

/**
 * Shared constraints for:
 * - {@link json},
 * - {@link jsonValue},
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
  depthSize?: DepthSize;
  /**
   * Maximal depth allowed
   * @defaultValue Number.POSITIVE_INFINITY — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 2.5.0
   */
  maxDepth?: number;
  /**
   * Only generate instances having keys and values made of ascii strings (when true)
   * @defaultValue true
   * @remarks Since 3.19.0
   */
  noUnicodeString?: boolean;
}

/**
 * Shared constraints for:
 * - {@link unicodeJson},
 * - {@link unicodeJsonValue}
 *
 * @remarks Since 3.19.0
 * @public
 */
export interface UnicodeJsonSharedConstraints {
  /**
   * Limit the depth of the object by increasing the probability to generate simple values (defined via values)
   * as we go deeper in the object.
   *
   * @remarks Since 2.20.0
   */
  depthSize?: DepthSize;
  /**
   * Maximal depth allowed
   * @defaultValue Number.POSITIVE_INFINITY — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
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
  constraints: JsonSharedConstraints,
): ObjectConstraints {
  const { depthSize, maxDepth } = constraints;
  const key = stringArbitrary;
  const values = [
    boolean(), // any boolean
    double({ noDefaultInfinity: true, noNaN: true }), // any number
    stringArbitrary, // any string
    constant(null),
  ];
  return { key, values, depthSize, maxDepth };
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
