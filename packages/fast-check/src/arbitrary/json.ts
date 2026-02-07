import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { jsonValue } from './jsonValue.js';
import type { JsonSharedConstraints } from './_internals/helpers/JsonConstraintsBuilder.js';

export type { JsonSharedConstraints };

/** @internal */
const safeJsonStringify = JSON.stringify;

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
  return arb.map(safeJsonStringify);
}
