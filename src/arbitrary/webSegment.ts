import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildAlphaNumericPercentArbitrary } from './_internals/builders/CharacterRangeArbitraryBuilder';
import { stringOf } from './stringOf';

/**
 * For internal segment of an URI (web included)
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986}
 *
 * eg.: In the url `https://github.com/dubzzz/fast-check/`, `dubzzz` and `fast-check` are segments
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webSegment(): Arbitrary<string> {
  // pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
  // segment       = *pchar
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@'];
  return stringOf(buildAlphaNumericPercentArbitrary(others));
}
