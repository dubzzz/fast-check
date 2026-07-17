import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { jsonValue } from './jsonValue.js';
import type { JsonSharedConstraints, JsonValue } from './_internals/helpers/JsonConstraintsBuilder.js';
import { Error } from '../utils/globals.js';

export type { JsonSharedConstraints };

/** @internal */
function jsonStringUnmapper(value: unknown): JsonValue {
  if (typeof value !== 'string') {
    throw new Error('Cannot unmap the passed value');
  }
  return JSON.parse(value) as JsonValue;
}

/**
 * For any JSON strings
 *
 * Keys and string values rely on {@link string}
 *
 * @param constraints - Constraints to be applied onto the generated instance (since 2.5.0)
 *
 * @remarks Since 0.0.7
 * @public
 */
export function json(constraints: JsonSharedConstraints = {}): Arbitrary<string> {
  const arb = jsonValue(constraints);
  return arb.map(JSON.stringify, jsonStringUnmapper);
}
