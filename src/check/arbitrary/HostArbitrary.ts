import { array } from './ArrayArbitrary';
import {
  buildAlphaNumericPercentArb,
  buildLowerAlphaArb,
  buildLowerAlphaNumericArb,
} from './helpers/SpecificCharacterRange';
import { option } from '../../arbitrary/option';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';
import { Arbitrary } from './definition/Arbitrary';

/** @internal */
export function filterInvalidSubdomainLabel(subdomainLabel: string): boolean {
  // Here our definition of a subdomain is <label> and "[l]abels must be 63 characters or less"
  // According RFC 1034 a subdomain should be defined as follows:
  //  - <subdomain> ::= <label> | <subdomain> "." <label>
  //  - <label> ::= <letter> [ [ <ldh-str> ] <let-dig> ]
  //  - <ldh-str> ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
  //  - <let-dig-hyp> ::= <let-dig> | "-"
  //  - <let-dig> ::= <letter> | <digit>
  //  - <letter> ::= any one of the 52 alphabetic characters A through Z in upper case and a through z in lower case
  //  - <digit> ::= any one of the ten digits 0 through 9
  // If we strictly follow RFC 1034, 9gag would be an invalid domain. Support for such domain has been added by ....
  if (subdomainLabel.length > 63) {
    return false; // invalid, it seems that this restriction has been relaxed in modern web browsers
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
function subdomainLabel() {
  const alphaNumericArb = buildLowerAlphaNumericArb([]);
  const alphaNumericHyphenArb = buildLowerAlphaNumericArb(['-']);
  // Rq: maxLength = 61 because max length of a label is 63 according to RFC 1034
  //     and we add 2 characters to this generated value
  return tuple(alphaNumericArb, option(tuple(stringOf(alphaNumericHyphenArb, { maxLength: 61 }), alphaNumericArb)))
    .map(([f, d]) => (d === null ? f : `${f}${d[0]}${d[1]}`))
    .filter(filterInvalidSubdomainLabel);
}

/**
 * For domains
 * having an extension with at least two lowercase characters
 *
 * According to {@link https://www.ietf.org/rfc/rfc1034.txt | RFC 1034},
 * {@link https://www.ietf.org/rfc/rfc1035.txt | RFC 1035},
 * {@link https://www.ietf.org/rfc/rfc1123.txt | RFC 1123} and
 * {@link https://url.spec.whatwg.org/ | WHATWG URL Standard}
 *
 * @remarks Since 1.14.0
 * @public
 */
export function domain(): Arbitrary<string> {
  const alphaNumericArb = buildLowerAlphaArb([]);
  // A list of public suffixes can be found here: https://publicsuffix.org/list/public_suffix_list.dat
  // our current implementation does not follwo this list and generate a fully randomized suffix
  // which is probably not in this list (probability would be low)
  const publicSuffixArb = stringOf(alphaNumericArb, { minLength: 2, maxLength: 10 });
  return (
    tuple(array(subdomainLabel(), { minLength: 1, maxLength: 5 }), publicSuffixArb)
      .map(([mid, ext]) => `${mid.join('.')}.${ext}`)
      // Required by RFC 1034:
      //    To simplify implementations, the total number of octets that represent
      //    a domain name (i.e., the sum of all label octets and label lengths) is limited to 255.
      // It seems that this restriction has been relaxed in modern web browsers.
      .filter((d) => d.length <= 255)
  );
}

/** @internal */
export function hostUserInfo(): Arbitrary<string> {
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':'];
  return stringOf(buildAlphaNumericPercentArb(others));
}
