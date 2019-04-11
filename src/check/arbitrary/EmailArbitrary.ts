import { array } from './ArrayArbitrary';
import { buildLowerAlphaNumericArb } from './helpers/SpecificCharacterRange';
import { domain } from './HostArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

/**
 * For email address
 *
 * According to RFC 5322 - https://www.ietf.org/rfc/rfc5322.txt
 */
export function emailAddress() {
  const others = ['!', '#', '$', '%', '&', "'", '*', '+', '-', '/', '=', '?', '^', '_', '`', '{', '|', '}', '~'];
  const atextArb = buildLowerAlphaNumericArb(others);
  const dotAtomArb = array(stringOf(atextArb, 1, 10), 1, 5).map(a => a.join('.'));
  return tuple(dotAtomArb, domain()).map(([lp, d]) => `${lp}@${d}`);
}
