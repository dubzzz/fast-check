import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { IntegerArbitrary } from './_internals/IntegerArbitrary.js';


/**
 * For integers between Number.MIN_SAFE_INTEGER (included) and Number.MAX_SAFE_INTEGER (included)
 * @remarks Since 1.11.0
 * @public
 */
export function maxSafeInteger(): Arbitrary<number> {
  return new IntegerArbitrary(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
}
