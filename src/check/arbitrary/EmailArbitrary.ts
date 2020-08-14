import { array } from './ArrayArbitrary';
import { buildLowerAlphaNumericArb } from './helpers/SpecificCharacterRange';
import { domain } from './HostArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';
import { Arbitrary } from './definition/Arbitrary';

/**
 * For email address
 *
 * According to {@link https://www.ietf.org/rfc/rfc5322.txt | RFC 5322}
 *
 * @public
 */
export function emailAddress(): Arbitrary<string> {
  const others = ['!', '#', '$', '%', '&', "'", '*', '+', '-', '/', '=', '?', '^', '_', '`', '{', '|', '}', '~'];
  const atextArb = buildLowerAlphaNumericArb(others);
  const dotAtomArb = array(stringOf(atextArb, 1, 10), 1, 5).map((a) => a.join('.'));
  return tuple(dotAtomArb, domain()).map(([lp, d]) => `${lp}@${d}`);
}
