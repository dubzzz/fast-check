import { Arbitrary } from './definition/Arbitrary';
import { constantFrom } from './ConstantArbitrary';

type FalsyType = false | null | 0 | '' | typeof NaN | undefined;

/**
 * For falsy values:
 * - ''
 * - 0
 * - NaN
 * - false
 * - null
 * - undefined
 */
function falsy(): Arbitrary<FalsyType> {
  return constantFrom<FalsyType>(false, null, undefined, 0, '', NaN);
}

export { falsy };
