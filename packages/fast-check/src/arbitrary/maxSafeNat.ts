import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { IntegerArbitrary } from './_internals/IntegerArbitrary';

const safeMaxSafeInteger = Number.MAX_SAFE_INTEGER;

/**
 * For positive integers between 0 (included) and Number.MAX_SAFE_INTEGER (included)
 * @remarks Since 1.11.0
 * @public
 */
export function maxSafeNat(): Arbitrary<number> {
  return new IntegerArbitrary(0, safeMaxSafeInteger);
}
