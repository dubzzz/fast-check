import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { buildAlphaNumericPercentArbitrary } from './CharacterRangeArbitraryBuilder';
import { stringOf } from '../../stringOf';

/** @internal */
export function buildUriQueryOrFragmentArbitrary(): Arbitrary<string> {
  // query         = *( pchar / "/" / "?" )
  // fragment      = *( pchar / "/" / "?" )
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@', '/', '?'];
  return stringOf(buildAlphaNumericPercentArbitrary(others));
}
