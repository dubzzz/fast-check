import { array } from './ArrayArbitrary';
import {
  buildAlphaNumericPercentArb,
  buildLowerAlphaArb,
  buildLowerAlphaNumericArb
} from './helpers/SpecificCharacterRange';
import { option } from './OptionArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

/** @hidden */
function subdomain() {
  const alphaNumericArb = buildLowerAlphaNumericArb([]);
  const alphaNumericHyphenArb = buildLowerAlphaNumericArb(['-']);
  return tuple(alphaNumericArb, option(tuple(stringOf(alphaNumericHyphenArb), alphaNumericArb)))
    .map(([f, d]) => (d === null ? f : `${f}${d[0]}${d[1]}`))
    .filter(d => d.length <= 63)
    .filter(d => {
      // We discard any subdomain starting by xn--
      // as they would require lots of checks to confirm if they are valid internationalized domains.
      // While they still are valid subdomains they might be problematic with some libs,
      // so we prefer not to include them by default (eg.: new URL in Node does not accept invalid internationalized domains)
      return d.length < 4 || d[0] !== 'x' || d[1] !== 'n' || d[2] !== '-' || d[3] !== '-';
    });
}

/**
 * For domains
 * having an extension with at least two lowercase characters
 *
 * According to RFC 1034, RFC 1123 and WHATWG URL Standard
 * - https://www.ietf.org/rfc/rfc1034.txt
 * - https://www.ietf.org/rfc/rfc1123.txt
 * - https://url.spec.whatwg.org/
 */
export function domain() {
  const alphaNumericArb = buildLowerAlphaArb([]);
  const extensionArb = stringOf(alphaNumericArb, 2, 10);
  return tuple(array(subdomain(), 1, 5), extensionArb)
    .map(([mid, ext]) => `${mid.join('.')}.${ext}`)
    .filter(d => d.length <= 255);
}

/** @hidden */
export function hostUserInfo() {
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':'];
  return stringOf(buildAlphaNumericPercentArb(others));
}
