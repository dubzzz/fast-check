import { array } from './ArrayArbitrary';
import {
  buildAlphaNumericPercentArb,
  buildLowerAlphaArb,
  buildLowerAlphaNumericArb
} from './helpers/SpecificCharacterRange';
import { option } from './OptionArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

/** @internal */
function subdomain() {
  const alphaNumericArb = buildLowerAlphaNumericArb([]);
  const alphaNumericHyphenArb = buildLowerAlphaNumericArb(['-']);
  return tuple(alphaNumericArb, option(tuple(stringOf(alphaNumericHyphenArb), alphaNumericArb)))
    .map(([f, d]) => (d === null ? f : `${f}${d[0]}${d[1]}`))
    .filter(d => d.length <= 63);
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

/** @internal */
export function hostUserInfo() {
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':'];
  return stringOf(buildAlphaNumericPercentArb(others));
}
