import { array } from '../../arbitrary/array';
import { buildLowerAlphaNumericArb } from './helpers/SpecificCharacterRange';
import { domain } from './HostArbitrary';
import { stringOf } from '../../arbitrary/stringOf';
import { tuple } from '../../arbitrary/tuple';
import { Arbitrary } from './definition/Arbitrary';

/**
 * For email address
 *
 * According to {@link https://www.ietf.org/rfc/rfc2821.txt | RFC 2821},
 * {@link https://www.ietf.org/rfc/rfc3696.txt | RFC 3696} and
 * {@link https://www.ietf.org/rfc/rfc5322.txt | RFC 5322}
 *
 * @remarks Since 1.14.0
 * @public
 */
export function emailAddress(): Arbitrary<string> {
  const others = ['!', '#', '$', '%', '&', "'", '*', '+', '-', '/', '=', '?', '^', '_', '`', '{', '|', '}', '~'];
  const atextArb = buildLowerAlphaNumericArb(others);
  const localPartArb = array(stringOf(atextArb, { minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 })
    .map((a) => a.join('.'))
    // According to RFC 2821:
    //    The maximum total length of a user name or other local-part is 64 characters.
    .filter((lp) => lp.length <= 64);

  return tuple(localPartArb, domain()).map(([lp, d]) => `${lp}@${d}`);
}
