import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { buildAlphaNumericPercentArbitrary } from './CharacterRangeArbitraryBuilder';
import { string } from '../../string';
import type { SizeForArbitrary } from '../helpers/MaxLengthFromMinLength';

/** @internal */
export function buildUriQueryOrFragmentArbitrary(size: Exclude<SizeForArbitrary, 'max'>): Arbitrary<string> {
  // query         = *( pchar / "/" / "?" )
  // fragment      = *( pchar / "/" / "?" )
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@', '/', '?'];
  return string({ unit: buildAlphaNumericPercentArbitrary(others), size });
}
