import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { IntegerArbitrary } from './_internals/IntegerArbitrary';

const safeMinSafeInteger = Number.MIN_SAFE_INTEGER;
const safeMaxSafeInteger = Number.MAX_SAFE_INTEGER;

/**
 * For integers between Number.MIN_SAFE_INTEGER (included) and Number.MAX_SAFE_INTEGER (included)
 * @remarks Since 1.11.0
 * @public
 */
export function maxSafeInteger(): Arbitrary<number> {
  return new IntegerArbitrary(safeMinSafeInteger, safeMaxSafeInteger);
}
