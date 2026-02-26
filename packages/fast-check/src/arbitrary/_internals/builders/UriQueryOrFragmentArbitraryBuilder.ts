import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { getOrCreateAlphaNumericPercentArbitrary } from './CharacterRangeArbitraryBuilder.js';
import { string } from '../../string.js';
import type { SizeForArbitrary } from '../helpers/MaxLengthFromMinLength.js';

/** @internal */
export function buildUriQueryOrFragmentArbitrary(size: Exclude<SizeForArbitrary, 'max'>): Arbitrary<string> {
  // query         = *( pchar / "/" / "?" )
  // fragment      = *( pchar / "/" / "?" )
  return string({ unit: getOrCreateAlphaNumericPercentArbitrary("-._~!$&'()*+,;=:@/?"), size });
}
