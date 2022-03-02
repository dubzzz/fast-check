import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { buildAlphaNumericPercentArbitrary } from './CharacterRangeArbitraryBuilder';
import { stringOf } from '../../stringOf';
import { SizeForArbitrary } from '../helpers/MaxLengthFromMinLength';

/** @internal */
export function buildUriQueryOrFragmentArbitrary(size: Exclude<SizeForArbitrary, 'max'>): Arbitrary<string> {
  // query         = *( pchar / "/" / "?" )
  // fragment      = *( pchar / "/" / "?" )
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@', '/', '?'];
  return stringOf(buildAlphaNumericPercentArbitrary(others), { size });
}
