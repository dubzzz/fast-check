import { array } from './ArrayArbitrary';
import {
  buildAlphaNumericPercentArb,
  buildLowerAlphaArb,
  buildLowerAlphaNumericArb,
} from './helpers/SpecificCharacterRange';
import { option } from './OptionArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';
import { Arbitrary } from './definition/Arbitrary';

/** @internal */
export function filterInvalidSubdomainLabel(subdomainLabel: string): boolean {
  // Here our definition of a subdomain is <label> and "[l]abels must be 63 characters or less"
  // According RFC 1123 a subdomain should be defined as follows:
  //  - <subdomain> ::= <label> | <subdomain> "." <label>
  //  - <label> ::= <letter> [ [ <ldh-str> ] <let-dig> ]
  //  - <ldh-str> ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
  //  - <let-dig-hyp> ::= <let-dig> | "-"
  //  - <let-dig> ::= <letter> | <digit>
  //  - <letter> ::= any one of the 52 alphabetic characters A through Z in upper case and a through z in lower case
  //  - <digit> ::= any one of the ten digits 0 through 9
  if (subdomainLabel.length > 63) {
    return false; // invalid
  }
  // We discard any subdomain starting by xn--
  // as they would require lots of checks to confirm if they are valid internationalized domains.
  // While they still are valid subdomains they might be problematic with some libs,
  // so we prefer not to include them by default (eg.: new URL in Node does not accept invalid internationalized domains)
  return (
    subdomainLabel.length < 4 ||
    subdomainLabel[0] !== 'x' ||
    subdomainLabel[1] !== 'n' ||
    subdomainLabel[2] !== '-' ||
    subdomainLabel[3] !== '-'
  );
}

/** @internal */
function subdomain() {
  const alphaNumericArb = buildLowerAlphaNumericArb([]);
  const alphaNumericHyphenArb = buildLowerAlphaNumericArb(['-']);
  return tuple(alphaNumericArb, option(tuple(stringOf(alphaNumericHyphenArb), alphaNumericArb)))
    .map(([f, d]) => (d === null ? f : `${f}${d[0]}${d[1]}`))
    .filter(filterInvalidSubdomainLabel);
}

/**
 * For domains
 * having an extension with at least two lowercase characters
 *
 * According to {@link https://www.ietf.org/rfc/rfc1034.txt | RFC 1034},
 * {@link https://www.ietf.org/rfc/rfc1123.txt | RFC 1123} and
 * {@link https://url.spec.whatwg.org/ | WHATWG URL Standard}
 *
 * @public
 */
export function domain(): Arbitrary<string> {
  const alphaNumericArb = buildLowerAlphaArb([]);
  const extensionArb = stringOf(alphaNumericArb, { minLength: 2, maxLength: 10 });
  return tuple(array(subdomain(), { minLength: 1, maxLength: 5 }), extensionArb)
    .map(([mid, ext]) => `${mid.join('.')}.${ext}`)
    .filter((d) => d.length <= 255);
}

/** @internal */
export function hostUserInfo(): Arbitrary<string> {
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':'];
  return stringOf(buildAlphaNumericPercentArb(others));
}
